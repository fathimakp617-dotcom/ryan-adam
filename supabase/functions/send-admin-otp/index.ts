import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate a secure 8-digit OTP
const generateOTP = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Simple hash function for OTP storage
const hashOTP = async (otp: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    const { email } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is in admin list
    if (!adminEmails.includes(normalizedEmail)) {
      console.log(`Admin OTP request denied for: ${normalizedEmail}`);
      // Return generic message to avoid email enumeration
      return new Response(
        JSON.stringify({ success: true, message: "If this email is registered as admin, you will receive an OTP" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean up expired OTPs
    await supabase.rpc("cleanup_expired_admin_otps");

    // Delete any existing OTPs for this email
    await supabase.from("admin_otps").delete().eq("email", normalizedEmail);

    // Generate new OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    const { error: insertError } = await supabase.from("admin_otps").insert({
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP email
    const resend = new Resend(resendApiKey);
    
    const { error: emailError } = await resend.emails.send({
      from: "Rayn Adam <security@raynadamperfume.com>",
      to: [normalizedEmail],
      subject: "🔐 Admin Access OTP - Rayn Adam",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 0;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1c1c1c 0%, #2d2d2d 100%); padding: 30px; text-align: center;">
            <h1 style="color: #c7915e; margin: 0; font-size: 24px; letter-spacing: 2px;">RAYN ADAM</h1>
            <p style="color: #a87c39; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 1px;">ADMIN ACCESS</p>
          </div>

          <div style="padding: 30px; background: #ffffff;">
            <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 20px;">Admin Verification Code</h2>
            
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              Your one-time password for admin access:
            </p>

            <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0;">
              <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">
                ${otp}
              </span>
            </div>

            <p style="color: #ef4444; font-size: 13px; margin: 20px 0;">
              ⚠️ This code expires in <strong>10 minutes</strong>
            </p>

            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
              If you didn't request this code, please ignore this email and ensure your account is secure.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #1c1c1c; padding: 20px; text-align: center;">
            <p style="color: #6b7280; margin: 0; font-size: 11px;">
              This is an automated security notification from Rayn Adam
            </p>
          </div>
        </div>
      `,
    });

    if (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // Clean up the stored OTP
      await supabase.from("admin_otps").delete().eq("email", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "Failed to send OTP email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin OTP sent to: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-admin-otp:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
