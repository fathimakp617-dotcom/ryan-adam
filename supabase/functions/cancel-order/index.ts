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

    // Restore stock for cancelled order items
    const items = order.items as Array<{ productId: string; quantity: number }>;
    for (const item of items) {
      try {
        // Get current stock and add back the quantity
        const { data: currentProduct } = await supabaseClient
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .maybeSingle();
        
        if (currentProduct) {
          await supabaseClient
            .from('products')
            .update({ 
              stock_quantity: currentProduct.stock_quantity + item.quantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.productId);
          console.log(`Stock restored for ${item.productId}: +${item.quantity}`);
        }
      } catch (stockErr) {
        console.error(`Failed to restore stock for ${item.productId}:`, stockErr);
        // Don't fail cancellation if stock restore fails
      }
    }

    console.log(`Order ${order.order_number} cancelled successfully`);

    // Send notification emails
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const items = order.items as Array<{ name: string; quantity: number; price: number }>;
      const itemsList = items.map((item) => 
        `<li>${item.name} x${item.quantity} - ₹${item.price.toLocaleString()}</li>`
      ).join("");

      // Send customer cancellation email
      try {
        await resend.emails.send({
          from: "Rayn Adam <shipping@raynadamperfume.com>",
          to: [order.customer_email],
          subject: `❌ Order Cancelled - ${order.order_number}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #a87c39;">
                        <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #c9a45c; font-weight: 300;">RAYN ADAM</h1>
                        <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; color: #888; text-transform: uppercase;">Luxury Perfumes</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; text-align: center;">
                        <span style="font-size: 40px;">❌</span>
                        <h2 style="color: #ffffff; margin: 10px 0 0; font-size: 22px; font-weight: 500;">Order Cancelled</h2>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 35px 30px;">
                        <p style="font-size: 16px; color: #e0e0e0;">Dear ${order.customer_name},</p>
                        <p style="font-size: 15px; color: #aaa; line-height: 1.7;">Your order has been successfully cancelled as requested. If you did not request this cancellation, please contact us immediately.</p>
                        ${reason ? `<p style="font-size: 14px; color: #888;"><strong style="color: #a87c39;">Reason:</strong> ${reason}</p>` : ''}
                        <div style="background: #1c1c1c; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
                          <h3 style="color: #ef4444; margin: 0 0 15px 0;">Order #${order.order_number}</h3>
                          <ul style="margin: 0; padding-left: 20px; color: #f5f5f0;">${itemsList}</ul>
                          <p style="margin: 15px 0 0 0; font-weight: bold; color: #c7915e;">Total: Rs.${order.total.toLocaleString()}</p>
                        </div>
                        <p style="color: #888; font-size: 14px;">If you paid online, your refund will be processed within 5-7 business days.</p>
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #3d3d3d;">
                          <p style="color: #888; font-size: 14px;">Questions? Contact us at<br><a href="mailto:support@raynadamperfume.com" style="color: #c7915e; text-decoration: none;">support@raynadamperfume.com</a></p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                        <p style="margin: 0; color: #a87c39; font-size: 13px; letter-spacing: 2px;">RAYN ADAM</p>
                        <p style="margin: 8px 0 0; color: #555; font-size: 11px;">© 2026 Rayn Adam Private Limited. All rights reserved.</p>
                        <p style="margin: 5px 0 0; color: #444; font-size: 10px;">Malappuram – 673634, Kerala, India | +91 99466 47442</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
          `,
        });
        console.log("Customer cancellation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send customer cancellation email:", emailError);
      }

      // Send admin notification email
      if (adminEmail) {
        try {
          await resend.emails.send({
            from: "Rayn Adam <shipping@raynadamperfume.com>",
            to: [adminEmail],
            subject: `⚠️ Order Cancelled - ${order.order_number}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
              <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                  <tr><td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #a87c39;">
                          <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #c9a45c; font-weight: 300;">RAYN ADAM</h1>
                          <p style="margin: 8px 0 0; font-size: 11px; letter-spacing: 3px; color: #888; text-transform: uppercase;">Admin Notification</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 25px; text-align: center;">
                          <span style="font-size: 40px;">⚠️</span>
                          <h2 style="color: #ffffff; margin: 10px 0 0; font-size: 22px; font-weight: 500;">Order Cancelled</h2>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 35px 30px;">
                          <div style="background: #1c1c1c; border: 1px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                            <p style="margin: 0 0 10px; color: #f5f5f0; font-size: 18px;"><strong style="color: #a87c39;">Order:</strong> ${order.order_number}</p>
                            <p style="margin: 0 0 10px; color: #888; font-size: 14px;"><strong style="color: #a87c39;">Cancelled at:</strong> ${new Date().toLocaleString()}</p>
                            ${reason ? `<p style="margin: 0; color: #888; font-size: 14px;"><strong style="color: #ef4444;">Reason:</strong> ${reason}</p>` : ''}
                          </div>
                          <div style="background: #1c1c1c; border: 1px solid #3d3d3d; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                            <h3 style="color: #c7915e; margin: 0 0 12px; font-weight: 500;">Customer Details</h3>
                            <p style="margin: 0 0 8px; color: #f5f5f0;"><strong style="color: #a87c39;">Name:</strong> ${order.customer_name}</p>
                            <p style="margin: 0 0 8px; color: #f5f5f0;"><strong style="color: #a87c39;">Email:</strong> ${order.customer_email}</p>
                            <p style="margin: 0; color: #f5f5f0;"><strong style="color: #a87c39;">Phone:</strong> ${order.customer_phone || 'N/A'}</p>
                          </div>
                          <div style="background: #1c1c1c; border: 1px solid #3d3d3d; border-radius: 8px; padding: 20px;">
                            <h3 style="color: #c7915e; margin: 0 0 12px; font-weight: 500;">Cancelled Items</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #f5f5f0;">${itemsList}</ul>
                            <p style="margin: 15px 0 0 0; font-weight: bold; color: #c7915e;">Total: Rs.${order.total.toLocaleString()}</p>
                            <p style="margin: 10px 0 0; color: #888; font-size: 14px;">Payment: ${order.payment_method} (${order.payment_status})</p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
                          <p style="margin: 0; color: #666; font-size: 12px;">This is an automated notification from RAYN ADAM</p>
                          <p style="margin: 8px 0 0; color: #555; font-size: 11px;">© 2026 Rayn Adam Private Limited.</p>
                        </td>
                      </tr>
                    </table>
                  </td></tr>
                </table>
              </body>
              </html>
            `,
          });
          console.log("Admin notification email sent successfully");
        } catch (emailError) {
          console.error("Failed to send admin notification email:", emailError);
        }
      }
    } else {
      console.log("Skipping emails: RESEND_API_KEY not configured");
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
