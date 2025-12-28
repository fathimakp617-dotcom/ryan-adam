import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    if (!email || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: "Email and redirect URL are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate password reset link
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (resetError || !data?.properties?.action_link) {
      console.error("Error generating reset link:", resetError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = data.properties.action_link;

    // Send branded email via Resend
    // Note: Using resend.dev domain until raynadam.com is verified in Resend
    const emailResponse = await resend.emails.send({
      from: "Rayn Adam <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Password - Rayn Adam",
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
                        Reset Your Password
                      </h2>
                      <p style="margin: 0 0 30px; font-size: 15px; line-height: 1.8; color: #aaa; text-align: center;">
                        We received a request to reset your password. Click the button below to create a new password for your Rayn Adam account.
                      </p>
                      
                      <div style="text-align: center; margin: 40px 0;">
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 16px 40px; background-color: #c9a45c; color: #000; text-decoration: none; font-size: 13px; letter-spacing: 2px; font-weight: bold;">
                          RESET PASSWORD
                        </a>
                      </div>
                      
                      <p style="margin: 30px 0 0; font-size: 13px; line-height: 1.8; color: #666; text-align: center;">
                        This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; border-top: 1px solid #333; text-align: center;">
                      <p style="margin: 0; font-size: 11px; color: #666; letter-spacing: 1px;">
                        © 2024 Rayn Adam. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; font-size: 11px; color: #444;">
                        If the button doesn't work, copy this link:<br>
                        <a href="${resetLink}" style="color: #c9a45c; word-break: break-all;">${resetLink}</a>
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

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
