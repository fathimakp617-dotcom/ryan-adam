import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReturnRequest {
  order_id: string;
  reason: string;
  details?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, reason, details }: ReturnRequest = await req.json();

    if (!order_id || !reason) {
      return new Response(
        JSON.stringify({ error: "Order ID and reason are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Return request for order ${order_id} by user ${user.email}`);

    // Fetch the order and verify ownership
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this order
    if (order.customer_email.toLowerCase() !== user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "You can only request returns for your own orders" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order is eligible for return (only delivered orders)
    if (order.order_status !== "delivered") {
      return new Response(
        JSON.stringify({ error: `Returns can only be requested for delivered orders. Current status: ${order.order_status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if return already requested
    if (order.return_status) {
      return new Response(
        JSON.stringify({ error: `A return has already been requested for this order. Status: ${order.return_status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check return window (7 days from delivery - we'll use updated_at as delivery date proxy)
    const deliveryDate = new Date(order.updated_at);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceDelivery > 7) {
      return new Response(
        JSON.stringify({ error: "Return window has expired. Returns must be requested within 7 days of delivery." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order with return request
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        return_status: "requested",
        return_reason: reason,
        return_details: details || null,
        return_requested_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to submit return request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      actor_email: user.email || "unknown",
      actor_role: "customer",
      action_type: "return_requested",
      order_id: order_id,
      order_number: order.order_number,
      action_details: {
        reason,
        details: details || null,
        customer_name: order.customer_name,
      },
    });

    // Send notification to staff
    try {
      await supabase.functions.invoke("send-staff-notification", {
        body: {
          type: "order_status_update",
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          old_status: order.order_status,
          new_status: "return_requested",
          updated_by: user.email,
          items: order.items,
          total: order.total,
        },
      });
    } catch (notifyError) {
      console.error("Failed to send staff notification:", notifyError);
      // Don't fail the request if notification fails
    }

    console.log(`Return request submitted for order ${order.order_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Return request submitted successfully",
        return_status: "requested"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error processing return request:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process return request";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
