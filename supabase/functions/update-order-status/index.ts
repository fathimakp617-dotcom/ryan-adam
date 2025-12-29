import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-email, x-admin-token",
};

interface UpdateStatusRequest {
  order_id: string;
  new_status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  tracking_number?: string;
  tracking_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    // Parse admin emails (comma-separated)
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    console.log("Configured admin emails:", adminEmails.length);

    // Check for admin session from custom password-based auth
    const adminEmail = req.headers.get("x-admin-email");
    const adminToken = req.headers.get("x-admin-token");

    if (!adminEmail || !adminToken) {
      console.log("Missing admin credentials");
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify admin email is in allowed list
    if (!adminEmails.includes(adminEmail.toLowerCase())) {
      console.log(`Admin email not in allowed list: ${adminEmail}`);
      return new Response(
        JSON.stringify({ error: "Access denied. Admin privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin access granted for: ${adminEmail}`);

    const { order_id, new_status, tracking_number, tracking_url }: UpdateStatusRequest = await req.json();

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
