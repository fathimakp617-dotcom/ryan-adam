import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Keep this broad to avoid preflight failures across browsers/environments.
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
  otp_type: "login" | "signup" | "password_reset";
}

function getSafeRedirectTo(req: Request): string {
  // Default to configured site URL (production) but prefer the current request origin
  // so Preview auth flows return to Preview and can read localStorage.
  const fallback = Deno.env.get("SITE_URL") || "https://raynadamperfume.com";
  const origin = req.headers.get("origin")?.trim();
  const referer = req.headers.get("referer")?.trim();

  const candidate = origin || (referer ? (() => {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  })() : null);

  if (!candidate) return fallback;

  // Prevent open-redirect: only allow known/expected hosts.
  try {
    const u = new URL(candidate);
    const host = u.hostname;
    const allowedHosts = new Set([
      "raynadamperfume.com",
      "www.raynadamperfume.com",
    ]);

    const isLovablePreview = host.endsWith(".lovable.app") || host.endsWith(".lovableproject.com");
    if (allowedHosts.has(host) || isLovablePreview) return u.origin;
  } catch {
    // ignore
  }

  return fallback;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, otp, otp_type }: VerifyOtpRequest = await req.json();

    if (!email || !otp || !otp_type) {
      return new Response(
        JSON.stringify({ error: "Email, OTP, and OTP type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!/^\d{4}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("Verifying OTP for email:", email, "type:", otp_type);

    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from("custom_otps")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("otp_code", otp)
      .eq("otp_type", otp_type)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP verification failed:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin.from("custom_otps").update({ used_at: new Date().toISOString() }).eq("id", otpRecord.id);

    console.log("OTP verified successfully");

    // For login/signup: return an action_link and let the browser follow it.
    // This is the most reliable way to create a session without fighting token formats/expiry.
    if (otp_type === "login" || otp_type === "signup") {
      // Check if this is a phone number (digits only) or email
      const isPhoneNumber = /^\d+$/.test(email);
      let userEmail: string | null = null;
      let isNewUser = false;

      if (isPhoneNumber) {
        // Phone-based login: look up user by phone in profiles
        console.log("Phone-based login, looking up user by phone:", email);
        
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("phone", `+${email}`)
          .maybeSingle();

        if (profile?.user_id) {
          // Get user's email from auth
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
          userEmail = userData?.user?.email || null;
          console.log("Found existing user with email:", userEmail);
        }

        if (!userEmail) {
          // No existing user with this phone - they need to sign up
          console.log("No user found with this phone number, redirect to signup");
          return new Response(
            JSON.stringify({ 
              valid: true, 
              isNewUser: true,
              message: "Phone verified. Please complete registration." 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        // Email-based login: use the email directly
        userEmail = email;
        
        // Ensure user exists (create if missing)
        const { data: list } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

        if (!existingUser) {
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
          });

          if (createError) {
            console.error("Error creating user:", createError);
            return new Response(
              JSON.stringify({ error: "Failed to create account" }),
              { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
      }

      const redirectTo = getSafeRedirectTo(req);
      console.log(
        "Auth action_link redirectTo chosen:",
        redirectTo,
        "origin:",
        req.headers.get("origin"),
        "referer:",
        req.headers.get("referer")
      );

      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: userEmail,
        options: {
          // IMPORTANT: send back to the current app origin (Preview stays in Preview).
          redirectTo,
        },
      });

      if (linkError || !linkData?.properties?.action_link) {
        console.error("Error generating action link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to complete authentication" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, action_link: linkData.properties.action_link }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Password reset: OTP only
    return new Response(
      JSON.stringify({ valid: true, message: "OTP verified successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-custom-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
