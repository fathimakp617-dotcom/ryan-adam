import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateStatusRequest {
  order_id: string;
  new_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking_number?: string;
  tracking_url?: string;
  admin_email: string;
  admin_token: string;
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
    
    // Parse admin and shipping emails (comma-separated)
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    const shippingEmails = shippingEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    const allowedEmails = [...adminEmails, ...shippingEmails];

    console.log("Configured allowed emails:", allowedEmails.length);

    // Get admin credentials from request body
    const body: UpdateStatusRequest = await req.json();
    const { admin_email, admin_token, order_id, new_status, tracking_number, tracking_url } = body;

    if (!admin_email || !admin_token) {
      console.log("Missing credentials in body");
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify email is in allowed list (admin or shipping)
    if (!allowedEmails.includes(admin_email.toLowerCase())) {
      console.log(`Email not in allowed list: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Access denied. Privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine actor role
    const actorRole = adminEmails.includes(admin_email.toLowerCase()) ? "admin" : "shipping";

    console.log(`Access granted for: ${admin_email} (${actorRole})`);

    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({ error: "Order ID and new status are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(new_status)) {
      return new Response(
        JSON.stringify({ error: "Invalid status" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

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

    const oldStatus = order.order_status;
    console.log(`Updating order ${order.order_number} from ${oldStatus} to ${new_status}`);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      order_status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Add tracking info if provided
    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }
    if (tracking_url !== undefined) {
      updateData.tracking_url = tracking_url;
    }

    // Update order status
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${order.order_number} status updated to ${new_status}`);

    // Log the activity
    try {
      await supabaseClient.from("activity_logs").insert({
        actor_email: admin_email.toLowerCase(),
        actor_role: actorRole,
        action_type: "order_status_update",
        action_details: {
          old_status: oldStatus,
          new_status: new_status,
          tracking_number: tracking_number || order.tracking_number,
          tracking_url: tracking_url || order.tracking_url,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
        },
        order_id: order_id,
        order_number: order.order_number,
      });
      console.log(`Activity logged: order status update by ${admin_email}`);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Don't fail the update if activity logging fails
    }

    // Send customer notification email for status changes (except pending)
    if (new_status !== "pending" && new_status !== oldStatus) {
      try {
        const statusUpdatePayload = {
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          new_status: new_status,
          items: order.items,
          total: order.total,
          shipping_address: order.shipping_address,
          tracking_number: tracking_number || order.tracking_number,
          tracking_url: tracking_url || order.tracking_url,
        };

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-status-update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify(statusUpdatePayload),
        });

        if (!emailResponse.ok) {
          const emailError = await emailResponse.text();
          console.error("Failed to send status update email:", emailError);
        } else {
          console.log(`Status update email sent to ${order.customer_email}`);
        }
      } catch (emailError) {
        console.error("Error sending status update email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Order status updated to ${new_status}`,
        order_number: order.order_number,
        old_status: oldStatus,
        new_status: new_status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error updating order status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update order status";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
