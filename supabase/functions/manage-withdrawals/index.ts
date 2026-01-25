import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Session validation helper
async function validateSession(supabase: any, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  
  try {
    const { data: session } = await supabase
      .from("staff_sessions")
      .select("id, expires_at")
      .eq("email", email.toLowerCase())
      .eq("session_token", token)
      .maybeSingle();
    
    if (!session) return false;
    
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("staff_sessions").delete().eq("id", session.id);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmailsEnv = Deno.env.get("ADMIN_EMAILS") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action, admin_email, admin_token } = body;

    // Actions that require admin auth
    const adminActions = ["list", "approve", "reject", "complete"];
    
    if (adminActions.includes(action)) {
      const allowedEmails = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase());
      if (!admin_email || !allowedEmails.includes(admin_email.toLowerCase())) {
        console.log("Unauthorized admin access attempt:", admin_email);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!await validateSession(supabase, admin_email, admin_token)) {
        console.log(`Invalid session for: ${admin_email}`);
        return new Response(
          JSON.stringify({ error: "Session expired. Please log in again." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Handle different actions
    if (action === "create") {
      // Customer creating a withdrawal request
      const { 
        affiliate_id, 
        user_id, 
        amount, 
        payment_method, 
        bank_name, 
        account_number, 
        ifsc_code, 
        account_holder_name, 
        upi_id, 
        phone, 
        email 
      } = body;

      // Validate required fields
      if (!affiliate_id || !user_id || !amount || !payment_method || !phone || !email) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check minimum amount
      if (amount < 500) {
        return new Response(
          JSON.stringify({ error: "Minimum withdrawal amount is ₹500" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if affiliate has enough balance
      const { data: affiliate, error: affiliateError } = await supabase
        .from("affiliates")
        .select("total_earnings")
        .eq("id", affiliate_id)
        .eq("user_id", user_id)
        .maybeSingle();

      if (affiliateError || !affiliate) {
        console.error("Affiliate fetch error:", affiliateError);
        return new Response(
          JSON.stringify({ error: "Affiliate not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (affiliate.total_earnings < amount) {
        return new Response(
          JSON.stringify({ error: "Insufficient balance" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for pending requests
      const { data: pendingRequest } = await supabase
        .from("withdrawal_requests")
        .select("id")
        .eq("affiliate_id", affiliate_id)
        .eq("status", "pending")
        .maybeSingle();

      if (pendingRequest) {
        return new Response(
          JSON.stringify({ error: "You already have a pending withdrawal request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate payment method fields
      if (payment_method === "bank_transfer") {
        if (!bank_name || !account_number || !ifsc_code || !account_holder_name) {
          return new Response(
            JSON.stringify({ error: "Bank details are required for bank transfer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (payment_method === "upi") {
        if (!upi_id) {
          return new Response(
            JSON.stringify({ error: "UPI ID is required for UPI transfer" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Create withdrawal request
      const { data: newRequest, error: createError } = await supabase
        .from("withdrawal_requests")
        .insert({
          affiliate_id,
          user_id,
          amount,
          payment_method,
          bank_name,
          account_number,
          ifsc_code,
          account_holder_name,
          upi_id,
          phone,
          email,
          status: "pending"
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating withdrawal request:", createError);
        throw createError;
      }

      console.log(`Withdrawal request created: ${newRequest.id} for amount ₹${amount}`);

      return new Response(
        JSON.stringify({ success: true, request: newRequest }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "list") {
      // Admin listing all withdrawal requests
      const { status: filterStatus } = body;

      let query = supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterStatus && filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data: requests, error: listError } = await query;

      if (listError) {
        console.error("Error fetching withdrawal requests:", listError);
        throw listError;
      }

      // Fetch affiliate details separately for each request
      const affiliateIds = [...new Set(requests?.map(r => r.affiliate_id) || [])];
      const { data: affiliates } = await supabase
        .from("affiliates")
        .select("id, name, email, code, total_earnings")
        .in("id", affiliateIds);

      // Map affiliates to requests
      const affiliateMap = new Map(affiliates?.map(a => [a.id, a]) || []);
      const enrichedRequests = requests?.map(r => ({
        ...r,
        affiliates: affiliateMap.get(r.affiliate_id) || null
      })) || [];

      console.log(`Found ${enrichedRequests.length} withdrawal requests`);

      return new Response(
        JSON.stringify({ requests: enrichedRequests }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "approve") {
      // Admin approving a request
      const { request_id } = body;

      if (!request_id) {
        return new Response(
          JSON.stringify({ error: "Request ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: request, error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          processed_by: admin_email
        })
        .eq("id", request_id)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) {
        console.error("Error approving request:", updateError);
        throw updateError;
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_email: admin_email,
        actor_role: "admin",
        action_type: "withdrawal_approved",
        action_details: { request_id, amount: request.amount }
      });

      console.log(`Withdrawal request ${request_id} approved by ${admin_email}`);

      return new Response(
        JSON.stringify({ success: true, request }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "reject") {
      // Admin rejecting a request
      const { request_id, admin_notes } = body;

      if (!request_id) {
        return new Response(
          JSON.stringify({ error: "Request ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: request, error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          processed_by: admin_email,
          processed_at: new Date().toISOString(),
          admin_notes
        })
        .eq("id", request_id)
        .eq("status", "pending")
        .select()
        .single();

      if (updateError) {
        console.error("Error rejecting request:", updateError);
        throw updateError;
      }

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_email: admin_email,
        actor_role: "admin",
        action_type: "withdrawal_rejected",
        action_details: { request_id, amount: request.amount, reason: admin_notes }
      });

      console.log(`Withdrawal request ${request_id} rejected by ${admin_email}`);

      return new Response(
        JSON.stringify({ success: true, request }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "complete") {
      // Admin marking request as completed (payment sent)
      const { request_id, transaction_id, admin_notes } = body;

      if (!request_id) {
        return new Response(
          JSON.stringify({ error: "Request ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the request details
      const { data: existingRequest } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("id", request_id)
        .maybeSingle();

      if (!existingRequest) {
        return new Response(
          JSON.stringify({ error: "Request not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get affiliate earnings separately
      const { data: affiliateData } = await supabase
        .from("affiliates")
        .select("total_earnings")
        .eq("id", existingRequest.affiliate_id)
        .maybeSingle();

      if (existingRequest.status !== "approved" && existingRequest.status !== "pending") {
        return new Response(
          JSON.stringify({ error: "Request cannot be completed in current status" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update request status
      const { data: request, error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "completed",
          processed_by: admin_email,
          processed_at: new Date().toISOString(),
          transaction_id,
          admin_notes
        })
        .eq("id", request_id)
        .select()
        .single();

      if (updateError) {
        console.error("Error completing request:", updateError);
        throw updateError;
      }

      // Deduct amount from affiliate earnings
      const currentEarnings = affiliateData?.total_earnings || 0;
      const newEarnings = Math.max(0, currentEarnings - existingRequest.amount);

      await supabase
        .from("affiliates")
        .update({ total_earnings: newEarnings })
        .eq("id", existingRequest.affiliate_id);

      // Log activity
      await supabase.from("activity_logs").insert({
        actor_email: admin_email,
        actor_role: "admin",
        action_type: "withdrawal_completed",
        action_details: { 
          request_id, 
          amount: existingRequest.amount, 
          transaction_id,
          previous_balance: currentEarnings,
          new_balance: newEarnings
        }
      });

      console.log(`Withdrawal request ${request_id} completed by ${admin_email}. Amount: ₹${existingRequest.amount}`);

      return new Response(
        JSON.stringify({ success: true, request }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (action === "get_user_requests") {
      // Customer getting their own requests
      const { user_id } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "User ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: requests, error: listError } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false });

      if (listError) {
        console.error("Error fetching user requests:", listError);
        throw listError;
      }

      return new Response(
        JSON.stringify({ requests }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: unknown) {
    console.error("Error in manage-withdrawals:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
