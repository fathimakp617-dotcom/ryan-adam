import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hash function matching the one in send-admin-otp
const hashOTP = async (otp: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

// Generate a session token
const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    const { email, otp } = await req.json();
    
    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOTP = otp.trim();

    // Verify email is in admin list
    if (!adminEmails.includes(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean up expired OTPs
    await supabase.rpc("cleanup_expired_admin_otps");

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("admin_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (fetchError || !otpRecord) {
      console.log(`No valid OTP found for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify OTP hash
    const providedHash = await hashOTP(normalizedOTP);
    
    if (providedHash !== otpRecord.otp_hash) {
      console.log(`Invalid OTP attempt for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified and delete it
    await supabase.from("admin_otps").delete().eq("id", otpRecord.id);

    // Generate admin session token
    const sessionToken = generateSessionToken();
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    console.log(`Admin OTP verified for: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully",
        session_token: sessionToken,
        session_expiry: sessionExpiry,
        email: normalizedEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in verify-admin-otp:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
