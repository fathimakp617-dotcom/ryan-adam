import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  email: string;
  redirectUrl: string;
}

// Generate a 6-digit OTP
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: OtpRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate OTP using Supabase's built-in method
    const { data, error: otpError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (otpError) {
      console.error("Error generating OTP link:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Extract the OTP token from the link
    const otpToken = data?.properties?.hashed_token;
    
    // Generate a simple 6-digit code for display
    const displayOtp = generateOtp();
    
    // Store OTP in a simple way - we'll use Supabase's built-in OTP
    // For now, trigger the built-in OTP flow but send custom email
    const { error: signInError } = await supabaseAdmin.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (signInError) {
      console.error("Error triggering OTP:", signInError);
      return new Response(
        JSON.stringify({ error: "Failed to send OTP" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send branded email via Resend
    const emailResponse = await resend.emails.send({
      from: "Rayn Adam <noreply@raynadamperfume.com>",
      to: [email],
      subject: "Your Login Code - Rayn Adam",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Georgia', serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; min-height: 100vh;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1a1a1a; border: 1px solid #333;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #333;">
                      <h1 style="margin: 0; font-size: 28px; letter-spacing: 8px; color: #c9a45c; font-weight: normal;">
                        RAYN ADAM
                      </h1>
                      <p style="margin: 10px 0 0; font-size: 11px; letter-spacing: 3px; color: #888;">
                        LUXURY PERFUMES
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 50px 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 22px; color: #fff; font-weight: normal; text-align: center;">
                        Your Login Code
                      </h2>
                      <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.8; color: #aaa; text-align: center;">
                        Use the code below to sign in to your Rayn Adam account. This code will expire in 10 minutes.
                      </p>
                      
                      <div style="text-align: center; margin: 40px 0;">
                        <p style="margin: 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 2px;">
                          Verification Code
                        </p>
                        <p style="margin: 15px 0 0; font-size: 36px; letter-spacing: 12px; color: #c9a45c; font-weight: bold; font-family: monospace;">
                          Check your inbox
                        </p>
                        <p style="margin: 15px 0 0; font-size: 13px; color: #666;">
                          (Supabase will send you the actual code)
                        </p>
                      </div>
                      
                      <p style="margin: 30px 0 0; font-size: 13px; line-height: 1.8; color: #666; text-align: center;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid #333; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #666; letter-spacing: 1px;">
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
      `,
    });

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
