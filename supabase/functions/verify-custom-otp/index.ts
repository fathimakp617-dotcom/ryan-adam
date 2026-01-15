import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOtpRequest {
  email: string;
  otp: string;
  otp_type: 'login' | 'signup' | 'password_reset';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, otp_type }: VerifyOtpRequest = await req.json();

    if (!email || !otp || !otp_type) {
      return new Response(
        JSON.stringify({ error: "Email, OTP, and OTP type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate OTP format (4 digits)
    if (!/^\d{4}$/.test(otp)) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    console.log("Verifying OTP for email:", email, "type:", otp_type);

    // Find valid OTP
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('custom_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp)
      .eq('otp_type', otp_type)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      console.error("OTP verification failed:", fetchError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('custom_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', otpRecord.id);

    console.log("OTP verified successfully");

    // For login/signup, create a session for the user
    if (otp_type === 'login' || otp_type === 'signup') {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      let userId: string;
      
      if (!existingUser) {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          email_confirm: true,
        });
        
        if (createError) {
          console.error("Error creating user:", createError);
          return new Response(
            JSON.stringify({ error: "Failed to create account" }),
            { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        userId = newUser.user.id;
        console.log("Created new user:", userId);
      } else {
        userId = existingUser.id;
        console.log("Found existing user:", userId);
      }

      // Generate session tokens directly using admin API
      // This creates a valid session without needing magic link verification
      const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
        options: {
          // Set a short redirect to prevent actual redirect
          redirectTo: Deno.env.get("SITE_URL") || "https://raynadamperfume.com",
        }
      });

      if (sessionError) {
        console.error("Error generating session:", sessionError);
        return new Response(
          JSON.stringify({ error: "Failed to complete authentication" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract token_hash and use it to get actual session
      const tokenHash = sessionData?.properties?.hashed_token;
      
      if (!tokenHash) {
        console.error("No token hash returned");
        return new Response(
          JSON.stringify({ error: "Failed to generate authentication token" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify the token immediately to get a session - this must happen server-side
      // Using the anon client to properly exchange the token
      const supabaseAnon = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      const { data: verifyData, error: verifyError } = await supabaseAnon.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'magiclink',
      });

      if (verifyError || !verifyData.session) {
        console.error("Error verifying token:", verifyError);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log("Session created successfully for user:", verifyData.user?.email);
      
      return new Response(
        JSON.stringify({ 
          valid: true, 
          message: "OTP verified successfully",
          session: verifyData.session,
          user: verifyData.user
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For password reset, just confirm the OTP is valid
    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: "OTP verified successfully",
        email: email
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in verify-custom-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);