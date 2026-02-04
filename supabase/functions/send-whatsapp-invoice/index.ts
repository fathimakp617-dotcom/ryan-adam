import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  phone: string;
  order_number?: string;
  customer_name?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  total?: number;
  is_test?: boolean;
}

// Format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
};

// Send WhatsApp text message
const sendWhatsAppTextMessage = async (
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp API credentials not configured");
    return { success: false, error: "WhatsApp API not configured" };
  }

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`Sending WhatsApp invoice to: ${formattedPhone}`);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: formattedPhone,
          type: "text",
          text: {
            preview_url: false,
            body: message
          }
        }),
      }
    );

    const data = await response.json();
    console.log("WhatsApp API response status:", response.status);
    console.log("WhatsApp API response:", JSON.stringify(data));

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      
      if (data.error?.code === 131030) {
        return { 
          success: false, 
          error: "Recipient not on WhatsApp or hasn't opted in." 
        };
      }
      
      if (data.error?.code === 190) {
        return { 
          success: false, 
          error: "WhatsApp API authentication failed." 
        };
      }

      // Error 131047 means we need a template for non-24hr window
      if (data.error?.code === 131047) {
        return {
          success: false,
          error: "Cannot send free-form message. User hasn't messaged in 24hrs. Template message required."
        };
      }

      return { 
        success: false, 
        error: data.error?.message || "Failed to send WhatsApp message" 
      };
    }

    return { 
      success: true, 
      messageId: data.messages?.[0]?.id 
    };
  } catch (error) {
    console.error("WhatsApp API request failed:", error);
    return { success: false, error: String(error) };
  }
};

// Generate a formatted invoice message
const generateInvoiceMessage = (data: InvoiceRequest): string => {
  const orderNumber = data.order_number || "TEST-INV-001";
  const customerName = data.customer_name || "Test Customer";
  const date = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const items = data.items || [
    { name: "RAYN ADAM Elite EDP 50ml", quantity: 1, price: 299 },
    { name: "RAYN ADAM Amber Crown Attar 6ml", quantity: 1, price: 199 }
  ];

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = data.total || subtotal;

  let itemsText = items.map((item, i) => 
    `${i + 1}. ${item.name}\n   Qty: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${(item.quantity * item.price).toFixed(2)}`
  ).join("\n\n");

  const message = `
━━━━━━━━━━━━━━━━━━━━━
🧾 *RAYN ADAM - INVOICE*
━━━━━━━━━━━━━━━━━━━━━

📋 *Order:* ${orderNumber}
📅 *Date:* ${date}
👤 *Customer:* ${customerName}

━━━━━━━━━━━━━━━━━━━━━
📦 *ORDER ITEMS*
━━━━━━━━━━━━━━━━━━━━━

${itemsText}

━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL: ₹${total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━━

✅ Thank you for shopping with RAYN ADAM!

📍 RAYN ADAM PRIVATE LIMITED
Ward No. 21, Door No. 553/1
Kavumpadi, Pallikkal, Tirurangadi
Malappuram – 673634, Kerala, India
📞 +91 99466 47442

GSTIN: 32AAPCR2931R1ZS
━━━━━━━━━━━━━━━━━━━━━
`.trim();

  return message;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InvoiceRequest = await req.json();

    if (!requestData.phone) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Generating invoice for:", requestData.phone);
    console.log("Is test invoice:", requestData.is_test ?? true);

    // Generate the invoice message
    const invoiceMessage = generateInvoiceMessage(requestData);
    console.log("Invoice message generated, length:", invoiceMessage.length);

    // Send via WhatsApp
    const result = await sendWhatsAppTextMessage(requestData.phone, invoiceMessage);

    if (!result.success) {
      console.error("Failed to send WhatsApp invoice:", result.error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: result.error,
          message: "Failed to send invoice via WhatsApp"
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("WhatsApp invoice sent successfully, message ID:", result.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invoice sent successfully via WhatsApp",
        messageId: result.messageId,
        phone: formatPhoneNumber(requestData.phone)
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
