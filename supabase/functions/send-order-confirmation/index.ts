import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface OrderConfirmationRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  shipping_address: ShippingAddress;
  payment_method: string;
}

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const generateOrderEmailHTML = (order: OrderConfirmationRequest): string => {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${item.name}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${item.quantity}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const paymentMethodLabel = order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
                  <h1 style="margin: 0; color: #c9a962; font-family: Georgia, serif; font-size: 28px; letter-spacing: 2px;">
                    RAYN ADAM
                  </h1>
                  <p style="margin: 10px 0 0; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; letter-spacing: 3px;">
                    LUXURY PERFUMES
                  </p>
                </td>
              </tr>
              
              <!-- Order Confirmation -->
              <tr>
                <td style="padding: 40px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background-color: #22c55e; border-radius: 50%; display: inline-block; line-height: 60px;">
                      <span style="color: white; font-size: 30px;">✓</span>
                    </div>
                  </div>
                  
                  <h2 style="margin: 0 0 10px; text-align: center; color: #1a1a1a; font-family: Georgia, serif; font-size: 24px;">
                    Thank You for Your Order!
                  </h2>
                  <p style="margin: 0 0 30px; text-align: center; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px;">
                    Hi ${order.customer_name}, your order has been confirmed.
                  </p>
                  
                  <!-- Order Number -->
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0 0 5px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Order Number
                    </p>
                    <p style="margin: 0; color: #c9a962; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: bold; letter-spacing: 1px;">
                      ${order.order_number}
                    </p>
                  </div>
                  
                  <!-- Order Items -->
                  <h3 style="margin: 0 0 15px; color: #1a1a1a; font-family: Georgia, serif; font-size: 18px;">
                    Order Summary
                  </h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                    <thead>
                      <tr style="background-color: #f8f8f8;">
                        <th style="padding: 12px; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Item
                        </th>
                        <th style="padding: 12px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Qty
                        </th>
                        <th style="padding: 12px; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHTML}
                    </tbody>
                  </table>
                  
                  <!-- Order Totals -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666;">
                        Subtotal
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                        ${formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    ${order.discount > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        Discount
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #22c55e;">
                        -${formatCurrency(order.discount)}
                      </td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #666;">
                        Shipping
                      </td>
                      <td style="padding: 8px 0; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a;">
                        ${order.shipping === 0 ? 'FREE' : formatCurrency(order.shipping)}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #1a1a1a; font-size: 18px;">
                        Total
                      </td>
                      <td style="padding: 12px 0; border-top: 2px solid #1a1a1a; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: bold; color: #c9a962; font-size: 18px;">
                        ${formatCurrency(order.total)}
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Shipping Address -->
                  <div style="display: flex; gap: 20px;">
                    <div style="flex: 1; background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                      <h4 style="margin: 0 0 10px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                        Shipping Address
                      </h4>
                      <p style="margin: 0; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6;">
                        ${order.customer_name}<br>
                        ${order.shipping_address.address}<br>
                        ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.zipCode}<br>
                        ${order.shipping_address.country}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Payment Method -->
                  <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <h4 style="margin: 0 0 10px; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                      Payment Method
                    </h4>
                    <p style="margin: 0; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px;">
                      ${paymentMethodLabel}
                    </p>
                  </div>
                  
                  <!-- Footer Message -->
                  <p style="margin: 0; text-align: center; color: #888; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6;">
                    If you have any questions about your order, please contact us at<br>
                    <a href="mailto:support@raynadamperfume.com" style="color: #c9a962;">support@raynadamperfume.com</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
                  <p style="margin: 0 0 10px; color: #c9a962; font-family: Georgia, serif; font-size: 16px; letter-spacing: 2px;">
                    RAYN ADAM
                  </p>
                  <p style="margin: 0; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px;">
                    © 2024 Rayn Adam. All rights reserved.
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
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderConfirmationRequest = await req.json();
    
    console.log("Sending order confirmation email to:", orderData.customer_email);
    console.log("Order number:", orderData.order_number);

    const emailHTML = generateOrderEmailHTML(orderData);

    const emailResponse = await resend.emails.send({
      from: "Rayn Adam <orders@raynadamperfume.com>",
      to: [orderData.customer_email],
      subject: `Order Confirmed - ${orderData.order_number}`,
      html: emailHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending order confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);