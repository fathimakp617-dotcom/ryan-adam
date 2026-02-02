import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate admin session
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionToken = authHeader.replace("Bearer ", "");
    const { data: session, error: sessionError } = await supabaseClient
      .from("staff_sessions")
      .select("email, expires_at")
      .eq("session_token", sessionToken)
      .single();

    if (sessionError || !session || new Date(session.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin
    const { data: staff } = await supabaseClient
      .from("staff_members")
      .select("role")
      .eq("email", session.email)
      .single();

    if (!staff || staff.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, reviewId, isApproved } = await req.json();

    switch (action) {
      case "update_status": {
        const { data: updatedReview, error } = await supabaseClient
          .from("product_reviews")
          .update({ is_approved: isApproved })
          .eq("id", reviewId)
          .select()
          .single();

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: isApproved ? "review_approved" : "review_hidden",
          action_details: { review_id: reviewId },
        });

        return new Response(JSON.stringify({ review: updatedReview }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { error } = await supabaseClient
          .from("product_reviews")
          .delete()
          .eq("id", reviewId);

        if (error) throw error;

        // Log activity
        await supabaseClient.from("activity_logs").insert({
          actor_email: session.email,
          actor_role: "admin",
          action_type: "review_deleted",
          action_details: { review_id: reviewId },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: unknown) {
    console.error("Error in manage-reviews:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
