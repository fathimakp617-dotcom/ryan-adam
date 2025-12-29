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
        color: "#3b82f6",
        message: "Great news! Your order is now being processed and will be shipped soon.",
      };
    case "shipped":
      return {
        title: "Order Shipped",
        emoji: "🚚",
        color: "#8b5cf6",
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
        color: "#6b7280",
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
      <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #7c3aed; margin: 0 0 10px 0;">📍 Track Your Order</h3>
        ${request.tracking_number ? `<p style="margin: 5px 0;"><strong>Tracking Number:</strong> ${request.tracking_number}</p>` : ""}
        ${request.tracking_url ? `<p style="margin: 10px 0;"><a href="${request.tracking_url}" style="display: inline-block; background: #7c3aed; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Track Package</a></p>` : ""}
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
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
          <h1 style="color: #c7915e; margin: 0; font-size: 28px; letter-spacing: 2px;">RAYN ADAM</h1>
          <p style="color: #a87c39; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">LUXURY PERFUMES</p>
        </div>

        <!-- Status Banner -->
        <div style="background: ${config.color}; padding: 25px; text-align: center;">
          <span style="font-size: 40px;">${config.emoji}</span>
          <h2 style="color: white; margin: 10px 0 0 0; font-size: 24px;">${config.title}</h2>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151;">Dear ${request.customer_name},</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${config.message}</p>

          <!-- Order Info -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; border-bottom: 2px solid ${config.color}; padding-bottom: 10px;">
              Order #${request.order_number}
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #e5e7eb;">
                  <th style="padding: 12px; text-align: left;">Item</th>
                  <th style="padding: 12px; text-align: center;">Qty</th>
                  <th style="padding: 12px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold;">Total:</td>
                  <td style="padding: 15px 12px; text-align: right; font-weight: bold; color: ${config.color}; font-size: 18px;">
                    ${formatCurrency(request.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${trackingSection}

          <!-- Shipping Address -->
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 10px 0;">📍 Shipping Address</h3>
            <p style="margin: 0; color: #6b7280; line-height: 1.6;">
              ${request.shipping_address.address}<br>
              ${request.shipping_address.city}, ${request.shipping_address.state} ${request.shipping_address.zipCode}<br>
              ${request.shipping_address.country}
            </p>
          </div>

          <!-- Support -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Questions? Contact us at<br>
              <a href="mailto:support@raynadamperfume.com" style="color: #a87c39;">support@raynadamperfume.com</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #1c1c1c; padding: 20px; text-align: center;">
          <p style="color: #a87c39; margin: 0; font-size: 12px;">
            © 2026 Rayn Adam. All rights reserved.
          </p>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 11px;">
            Kozhikode, Kerala, India
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
