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
      const userExists = existingUsers?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());
      
      let userId: string;
      
      if (!userExists) {
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
      } else {
        // Get existing user
        const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
        userId = existingUser!.id;
      }

      // Generate a magic link that can be used client-side
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email,
      });

      if (linkError) {
        console.error("Error generating magic link:", linkError);
        return new Response(
          JSON.stringify({ error: "Failed to complete authentication" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Extract the token from the action link
      const actionLink = linkData?.properties?.action_link;
      const url = new URL(actionLink || "");
      const token = url.searchParams.get("token");
      const type = url.searchParams.get("type");
      
      return new Response(
        JSON.stringify({ 
          valid: true, 
          message: "OTP verified successfully",
          token: token,
          type: type,
          email: email
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