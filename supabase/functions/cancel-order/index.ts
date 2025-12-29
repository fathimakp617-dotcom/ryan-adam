import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CancelOrderRequest {
  order_id: string;
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmail = Deno.env.get("ADMIN_ORDER_EMAIL");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { order_id, reason }: CancelOrderRequest = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "Order ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Cancelling order ${order_id} for user ${user.id}`);

    // Fetch the order first to verify ownership and get details
    const { data: order, error: fetchError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !order) {
      console.error("Order fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Order not found or access denied" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.order_status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Only pending orders can be cancelled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order status to cancelled
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ order_status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order_id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to cancel order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${order.order_number} cancelled successfully`);

    // Send notification email to admin
    if (resendApiKey && adminEmail) {
      try {
        const resend = new Resend(resendApiKey);
        
        const items = order.items as Array<{ name: string; quantity: number; price: number }>;
        const itemsList = items.map((item) => 
          `<li>${item.name} x${item.quantity} - ₹${item.price.toLocaleString()}</li>`
        ).join("");

        await resend.emails.send({
          from: "Rayn Adam <onboarding@resend.dev>",
          to: [adminEmail],
          subject: `⚠️ Order Cancelled - ${order.order_number}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">Order Cancelled</h1>
              
              <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-size: 18px;"><strong>Order Number:</strong> ${order.order_number}</p>
                <p style="margin: 10px 0 0 0;"><strong>Cancelled At:</strong> ${new Date().toLocaleString()}</p>
                ${reason ? `<p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>

              <h2 style="color: #374151;">Customer Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${order.customer_name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${order.customer_email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${order.customer_phone || 'N/A'}</td>
                </tr>
              </table>

              <h2 style="color: #374151; margin-top: 20px;">Cancelled Items</h2>
              <ul style="background: #f9fafb; padding: 15px 15px 15px 35px; border-radius: 8px;">
                ${itemsList}
              </ul>

              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0;"><strong>Order Total:</strong> ₹${order.total.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0;"><strong>Payment Method:</strong> ${order.payment_method}</p>
                <p style="margin: 10px 0 0 0;"><strong>Payment Status:</strong> ${order.payment_status}</p>
              </div>

              <p style="color: #6b7280; font-size: 12px; margin-top: 30px; text-align: center;">
                This is an automated notification from Rayn Adam
              </p>
            </div>
          `,
        });
        
        console.log("Admin notification email sent successfully");
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
        // Don't fail the cancellation if email fails
      }
    } else {
      console.log("Skipping admin notification: RESEND_API_KEY or ADMIN_ORDER_EMAIL not configured");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Order cancelled successfully",
        order_number: order.order_number 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error cancelling order:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to cancel order";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
