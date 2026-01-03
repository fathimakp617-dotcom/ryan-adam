import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MarkCashReceivedRequest {
  order_id: string;
  cash_received: boolean;
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
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e);
    const shippingEmails = shippingEmailsRaw.split(",").map((e) => e.trim().toLowerCase()).filter((e) => e);
    const allowedEmails = [...adminEmails, ...shippingEmails];

    const body: MarkCashReceivedRequest = await req.json();
    const { admin_email, admin_token, order_id, cash_received } = body;

    if (!admin_email || !admin_token) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!allowedEmails.includes(admin_email.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Access denied. Privileges required." }),
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

    const actorRole = adminEmails.includes(admin_email.toLowerCase()) ? "admin" : "shipping";
    console.log(`Access granted for: ${admin_email} (${actorRole})`);

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the order
    const { data: order, error: fetchError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if it's a COD order
    if (order.payment_method !== 'cod') {
      return new Response(
        JSON.stringify({ error: "This action is only for Cash on Delivery orders" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Marking cash ${cash_received ? 'received' : 'pending'} for order ${order.order_number}`);

    // Update order
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({
        cash_received: cash_received,
        payment_status: cash_received ? 'paid' : (order.payment_status === 'paid' ? 'pending' : order.payment_status),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${order.order_number} cash_received set to ${cash_received}`);

    // Log the activity
    try {
      await supabaseClient.from("activity_logs").insert({
        actor_email: admin_email.toLowerCase(),
        actor_role: actorRole,
        action_type: "cash_received_update",
        action_details: {
          cash_received: cash_received,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          total: order.total,
        },
        order_id: order_id,
        order_number: order.order_number,
      });
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cash ${cash_received ? 'received' : 'pending'} for order ${order.order_number}`,
        order_number: order.order_number,
        cash_received: cash_received,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error marking cash received:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update order";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
