import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppOtpRequest {
  phone: string;
  email?: string;
  otp_type: "login" | "signup" | "password_reset";
}

// Generate a random 4-digit OTP
const generateOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Format phone number to E.164 format (remove + if present, ensure digits only)
const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, "");
  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  // If number doesn't start with country code, assume India (+91)
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }
  return cleaned;
};

// Send WhatsApp message using Meta WhatsApp Business API with text message
const sendWhatsAppMessage = async (
  phone: string,
  otpCode: string,
  otpType: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.error("WhatsApp API credentials not configured");
    console.error("Access token present:", !!accessToken);
    console.error("Phone number ID present:", !!phoneNumberId);
    return { success: false, error: "WhatsApp API not configured" };
  }

  // Log the phone number ID format (first 10 chars only for security)
  console.log("Phone Number ID format check (first 10 chars):", phoneNumberId.substring(0, 10));

  const formattedPhone = formatPhoneNumber(phone);
  console.log(`Sending WhatsApp OTP to: ${formattedPhone}`);

  // Generate message based on OTP type
  const messageText = otpType === "password_reset"
    ? `🔐 *Rayn Adam - Password Reset*\n\nYour password reset code is: *${otpCode}*\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this message.`
    : `🌸 *Rayn Adam - Verification Code*\n\nYour login code is: *${otpCode}*\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this message.`;

  try {
    // Using text message instead of template for simpler setup
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
            body: messageText,
          },
        }),
      }
    );

    const data = await response.json();
    console.log("WhatsApp API response status:", response.status);
    console.log("WhatsApp API response:", JSON.stringify(data));

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      
      // Check for specific error types
      if (data.error?.code === 131030) {
        return { 
          success: false, 
          error: "Recipient not on WhatsApp or hasn't opted in. Please use email verification instead." 
        };
      }
      
      if (data.error?.code === 190) {
        return { 
          success: false, 
          error: "WhatsApp API authentication failed. Please check API credentials." 
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, email, otp_type }: WhatsAppOtpRequest = await req.json();

    if (!phone) {
      console.error("Phone number is required");
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s-]{10,15}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      console.error("Invalid phone format:", phone);
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!otp_type || !["login", "signup", "password_reset"].includes(otp_type)) {
      return new Response(
        JSON.stringify({ error: "Valid OTP type is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Use phone as the identifier for OTP storage (or email if provided)
    const identifier = email?.toLowerCase() || formatPhoneNumber(phone);
    console.log(`Generating 4-digit OTP for ${otp_type}:`, identifier);

    // Generate custom 4-digit OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing unused OTPs for this identifier and type
    await supabaseAdmin
      .from("custom_otps")
      .delete()
      .eq("email", identifier)
      .eq("otp_type", otp_type)
      .is("used_at", null);

    // Insert new OTP
    const { error: insertError } = await supabaseAdmin
      .from("custom_otps")
      .insert({
        email: identifier,
        otp_code: otpCode,
        otp_type: otp_type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP code" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("OTP stored successfully, sending via WhatsApp");

    // Send OTP via WhatsApp
    const whatsappResult = await sendWhatsAppMessage(phone, otpCode, otp_type);

    if (!whatsappResult.success) {
      console.error("Failed to send WhatsApp message:", whatsappResult.error);
      
      // Clean up the OTP we just created since we couldn't send it
      await supabaseAdmin
        .from("custom_otps")
        .delete()
        .eq("email", identifier)
        .eq("otp_code", otpCode);

      return new Response(
        JSON.stringify({ 
          error: "Failed to send OTP via WhatsApp",
          details: whatsappResult.error 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the WhatsApp message
    await supabaseAdmin.from("whatsapp_logs").insert({
      phone_number: formatPhoneNumber(phone),
      message_type: `otp_${otp_type}`,
      message_content: `OTP: ${otpCode.substring(0, 2)}** (masked)`,
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    console.log("WhatsApp OTP sent successfully, message ID:", whatsappResult.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully via WhatsApp",
        messageId: whatsappResult.messageId
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
