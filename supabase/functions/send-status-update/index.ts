import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface StatusUpdateRequest {
  order_number: string;
  customer_name: string;
  customer_email: string;
  new_status: "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  total: number;
  shipping_address: ShippingAddress;
  tracking_number?: string;
  tracking_url?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case "processing":
      return {
        title: "Order Being Processed",
        emoji: "⚙️",
        color: "#a87c39", // Brand gold
        message: "Great news! Your order is now being processed and will be shipped soon.",
      };
    case "shipped":
      return {
        title: "Order Shipped",
        emoji: "🚚",
        color: "#c7915e", // Brand light gold
        message: "Your order is on its way! Track your package using the details below.",
      };
    case "delivered":
      return {
        title: "Order Delivered",
        emoji: "✅",
        color: "#22c55e",
        message: "Your order has been delivered. We hope you love your purchase!",
      };
    case "cancelled":
      return {
        title: "Order Cancelled",
        emoji: "❌",
        color: "#ef4444",
        message: "Your order has been cancelled. If you have any questions, please contact us.",
      };
    default:
      return {
        title: "Order Update",
        emoji: "📦",
        color: "#a87c39",
        message: "There's an update to your order.",
      };
  }
};

const generateStatusEmailHTML = (request: StatusUpdateRequest): string => {
  const config = getStatusConfig(request.new_status);
  const itemsList = request.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>
    `
    )
    .join("");

  const trackingSection =
    request.new_status === "shipped" && (request.tracking_number || request.tracking_url)
      ? `
      <div style="background: linear-gradient(135deg, rgba(168, 124, 57, 0.1) 0%, rgba(199, 145, 94, 0.1) 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid rgba(168, 124, 57, 0.3);">
        <h3 style="color: #a87c39; margin: 0 0 10px 0;">📍 Track Your Order</h3>
        ${request.tracking_number ? `<p style="margin: 5px 0; color: #1c1c1c;"><strong>Tracking Number:</strong> ${request.tracking_number}</p>` : ""}
        ${request.tracking_url ? `<p style="margin: 10px 0;"><a href="${request.tracking_url}" style="display: inline-block; background: linear-gradient(135deg, #a87c39 0%, #c7915e 100%); color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: 500;">Track Package</a></p>` : ""}
      </div>
    `
      : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${config.title}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #1c1c1c;">
      <div style="max-width: 600px; margin: 0 auto; background: #242424;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 40px 30px; text-align: center; border-bottom: 2px solid #a87c39;">
          <h1 style="color: #c7915e; margin: 0; font-size: 32px; letter-spacing: 3px; font-weight: 300;">RAYN ADAM</h1>
          <p style="color: #a87c39; margin: 8px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Luxury Perfumes</p>
        </div>

        <!-- Status Banner -->
        <div style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%); padding: 30px; text-align: center;">
          <span style="font-size: 48px;">${config.emoji}</span>
          <h2 style="color: white; margin: 15px 0 0 0; font-size: 26px; font-weight: 500; letter-spacing: 1px;">${config.title}</h2>
        </div>

        <!-- Content -->
        <div style="padding: 35px 30px;">
          <p style="font-size: 16px; color: #f5f5f0;">Dear ${request.customer_name},</p>
          <p style="font-size: 16px; color: #e0e0e0; line-height: 1.7;">${config.message}</p>

          <!-- Order Info -->
          <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3d3d3d;">
            <h3 style="color: #c7915e; margin: 0 0 20px 0; border-bottom: 2px solid #a87c39; padding-bottom: 12px; font-weight: 500; letter-spacing: 1px;">
              Order #${request.order_number}
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #2d2d2d;">
                  <th style="padding: 14px; text-align: left; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                  <th style="padding: 14px; text-align: center; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
                  <th style="padding: 14px; text-align: right; color: #a87c39; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList.replace(/border-bottom: 1px solid #e5e7eb/g, 'border-bottom: 1px solid #3d3d3d; color: #f5f5f0')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 18px 14px; text-align: right; font-weight: bold; color: #f5f5f0; border-top: 1px solid #3d3d3d;">Total:</td>
                  <td style="padding: 18px 14px; text-align: right; font-weight: bold; color: #c7915e; font-size: 20px; border-top: 1px solid #3d3d3d;">
                    ${formatCurrency(request.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${trackingSection}

          <!-- Shipping Address -->
          <div style="background: #1c1c1c; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #3d3d3d;">
            <h3 style="color: #c7915e; margin: 0 0 12px 0; font-weight: 500;">📍 Shipping Address</h3>
            <p style="margin: 0; color: #e0e0e0; line-height: 1.7;">
              ${request.shipping_address.address}<br>
              ${request.shipping_address.city}, ${request.shipping_address.state} ${request.shipping_address.zipCode}<br>
              ${request.shipping_address.country}
            </p>
          </div>

          <!-- Support -->
          <div style="text-align: center; margin-top: 35px; padding-top: 25px; border-top: 1px solid #3d3d3d;">
            <p style="color: #888; font-size: 14px;">
              Questions? Contact us at<br>
              <a href="mailto:support@raynadamperfume.com" style="color: #c7915e; text-decoration: none;">support@raynadamperfume.com</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #1c1c1c 0%, #0f0f0f 100%); padding: 25px; text-align: center; border-top: 1px solid #3d3d3d;">
          <p style="color: #a87c39; margin: 0; font-size: 13px; letter-spacing: 2px;">
            RAYN ADAM
          </p>
          <p style="color: #666; margin: 8px 0 0 0; font-size: 11px;">
            © 2026 Rayn Adam. All rights reserved.
          </p>
          <p style="color: #555; margin: 8px 0 0 0; font-size: 10px;">
            Malappuram – 673634, Kerala, India | +91 99466 47442
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const request: StatusUpdateRequest = await req.json();
    console.log(`Sending ${request.new_status} email to ${request.customer_email} for order ${request.order_number}`);

    const resend = new Resend(resendApiKey);
    const config = getStatusConfig(request.new_status);

    const emailHtml = generateStatusEmailHTML(request);

    const { data, error } = await resend.emails.send({
      from: "Rayn Adam <shipping@raynadamperfume.com>",
      to: [request.customer_email],
      subject: `${config.emoji} ${config.title} - Order #${request.order_number}`,
      html: emailHtml,
    });

    if (error) {
      console.error("Resend error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Status update email sent successfully:`, data);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error sending status update email:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
