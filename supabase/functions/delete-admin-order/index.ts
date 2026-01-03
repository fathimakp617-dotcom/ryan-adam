import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteOrderRequest {
  order_id: string;
  admin_email: string;
  admin_token: string;
}

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    const body: DeleteOrderRequest = await req.json();
    const { admin_email, admin_token, order_id } = body;

    if (!admin_email || !admin_token) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminEmails.includes(admin_email.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    if (!await validateSession(supabaseClient, admin_email, admin_token)) {
      console.log(`Invalid session for: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the order first to get details
    const { data: order, error: fetchError } = await supabaseClient
      .from("orders")
      .select("order_number")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the order
    const { error: deleteError } = await supabaseClient
      .from("orders")
      .delete()
      .eq("id", order_id);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${order.order_number} deleted by ${admin_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Order ${order.order_number} deleted successfully`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error deleting order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete order";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
