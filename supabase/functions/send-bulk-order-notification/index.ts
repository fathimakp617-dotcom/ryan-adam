import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkOrderNotificationRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_quantity: number;
  subtotal: number;
  bulk_discount: number;
  bulk_discount_percent: number;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  payment_method: string;
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const ADMIN_ORDER_EMAIL = Deno.env.get("ADMIN_ORDER_EMAIL");
    const SHIPPING_EMAILS = Deno.env.get("SHIPPING_EMAILS");

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const data: BulkOrderNotificationRequest = await req.json();
    console.log("Sending bulk order notification for:", data.order_number);

    // Collect all recipients
    const recipients: string[] = [];
    
    if (ADMIN_ORDER_EMAIL) {
      const adminEmails = ADMIN_ORDER_EMAIL.split(",").map(e => e.trim()).filter(Boolean);
      recipients.push(...adminEmails);
    }
    
    if (SHIPPING_EMAILS) {
      const shippingEmails = SHIPPING_EMAILS.split(",").map(e => e.trim()).filter(Boolean);
      recipients.push(...shippingEmails);
    }

    if (recipients.length === 0) {
      console.log("No recipients configured for bulk order notifications");
      return new Response(
        JSON.stringify({ success: true, message: "No recipients configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Remove duplicates
    const uniqueRecipients = [...new Set(recipients)];
    console.log("Sending to recipients:", uniqueRecipients);

    const resend = new Resend(RESEND_API_KEY);

    // Generate items table
    const itemsRows = data.items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #3a3a3a; color: #e5e5e5;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #3a3a3a; color: #e5e5e5; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #3a3a3a; color: #e5e5e5; text-align: right;">${formatPrice(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #3a3a3a; color: #a87c39; text-align: right; font-weight: bold;">${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join("");

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1a1a1a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #242424; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #a87c39 0%, #d4a857 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                🚨 BULK ORDER ALERT
              </h1>
              <p style="margin: 10px 0 0 0; color: #1a1a1a; font-size: 16px;">
                ${data.total_quantity} Items | ${data.bulk_discount_percent}% Bulk Discount Applied
              </p>
            </td>
          </tr>
          
          <!-- Order Info -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom: 20px;">
                    <h2 style="margin: 0; color: #a87c39; font-size: 18px; border-bottom: 1px solid #3a3a3a; padding-bottom: 10px;">
                      Order #${data.order_number}
                    </h2>
                  </td>
                </tr>
                
                <!-- Customer Details -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 6px; padding: 15px;">
                      <tr>
                        <td style="padding: 10px;">
                          <p style="margin: 0 0 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Customer</p>
                          <p style="margin: 0; color: #e5e5e5; font-size: 16px; font-weight: bold;">${data.customer_name}</p>
                          <p style="margin: 5px 0 0 0; color: #a87c39;">${data.customer_email}</p>
                          <p style="margin: 5px 0 0 0; color: #888;">${data.customer_phone}</p>
                        </td>
                        <td style="padding: 10px; text-align: right;">
                          <p style="margin: 0 0 8px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Payment</p>
                          <p style="margin: 0; color: #e5e5e5; font-size: 14px;">${data.payment_method === 'razorpay' ? 'Online (Razorpay)' : 'Cash on Delivery'}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Shipping Address -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Shipping Address</p>
                    <p style="margin: 0; color: #e5e5e5; line-height: 1.6;">
                      ${data.shipping_address.address}<br>
                      ${data.shipping_address.city}, ${data.shipping_address.state} ${data.shipping_address.zipCode}<br>
                      ${data.shipping_address.country}
                    </p>
                  </td>
                </tr>
                
                <!-- Items Table -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 6px; overflow: hidden;">
                      <tr style="background-color: #333;">
                        <th style="padding: 12px; text-align: left; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                        <th style="padding: 12px; text-align: center; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                        <th style="padding: 12px; text-align: right; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                        <th style="padding: 12px; text-align: right; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Total</th>
                      </tr>
                      ${itemsRows}
                    </table>
                  </td>
                </tr>
                
                <!-- Totals -->
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #2a2a2a; border-radius: 6px; padding: 15px;">
                      <tr>
                        <td style="padding: 8px 15px; color: #888;">Subtotal (${data.total_quantity} items)</td>
                        <td style="padding: 8px 15px; color: #e5e5e5; text-align: right;">${formatPrice(data.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 15px; color: #10b981; font-weight: bold;">
                          Bulk Discount (${data.bulk_discount_percent}%)
                        </td>
                        <td style="padding: 8px 15px; color: #10b981; text-align: right; font-weight: bold;">
                          -${formatPrice(data.bulk_discount)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 15px; color: #888;">Shipping</td>
                        <td style="padding: 8px 15px; color: #e5e5e5; text-align: right;">FREE</td>
                      </tr>
                      <tr style="border-top: 2px solid #a87c39;">
                        <td style="padding: 15px; color: #a87c39; font-size: 18px; font-weight: bold;">TOTAL</td>
                        <td style="padding: 15px; color: #a87c39; text-align: right; font-size: 24px; font-weight: bold;">${formatPrice(data.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 20px; text-align: center; border-top: 1px solid #3a3a3a;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                This is a bulk order notification from Rayn Adam Perfumes
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: "Rayn Adam <notifications@raynadamperfume.com>",
      to: uniqueRecipients,
      subject: `🚨 BULK ORDER: ${data.total_quantity} Items - Order #${data.order_number}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Failed to send bulk order notification:", emailError);
      return new Response(
        JSON.stringify({ error: emailError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Bulk order notification sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-bulk-order-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
