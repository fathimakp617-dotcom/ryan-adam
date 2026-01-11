import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactRequest = await req.json();

    // Validate inputs
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing contact form from ${name} (${email})`);

    // Send notification to admin
    const adminEmailResponse = await resend.emails.send({
      from: "Rayn Adam <notifications@raynadamperfume.com>",
      to: ["raynadamperfume@gmail.com"],
      subject: `New Contact: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px; text-align: center; border-bottom: 1px solid #333;">
                      <h1 style="margin: 0; color: #a87c39; font-size: 28px; letter-spacing: 4px; font-weight: 300;">RAYN ADAM</h1>
                      <p style="margin: 10px 0 0; color: #888; font-size: 12px; letter-spacing: 2px;">NEW CONTACT MESSAGE</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px;">FROM</p>
                            <p style="margin: 5px 0 0; color: #fff; font-size: 16px;">${name}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px;">EMAIL</p>
                            <p style="margin: 5px 0 0; color: #a87c39; font-size: 16px;">${email}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom: 20px;">
                            <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px;">SUBJECT</p>
                            <p style="margin: 5px 0 0; color: #fff; font-size: 16px;">${subject}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 20px; background-color: #0a0a0a; border-left: 3px solid #a87c39;">
                            <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px; margin-bottom: 10px;">MESSAGE</p>
                            <p style="margin: 0; color: #fff; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; border-top: 1px solid #333;">
                      <p style="margin: 0; color: #666; font-size: 12px;">Reply directly to this email to respond to the customer.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      reply_to: email,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // Send confirmation to customer
    const customerEmailResponse = await resend.emails.send({
      from: "Rayn Adam <notifications@raynadamperfume.com>",
      to: [email],
      subject: "We received your message - Rayn Adam",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border: 1px solid #333;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px; text-align: center; border-bottom: 1px solid #333;">
                      <h1 style="margin: 0; color: #a87c39; font-size: 28px; letter-spacing: 4px; font-weight: 300;">RAYN ADAM</h1>
                      <p style="margin: 10px 0 0; color: #888; font-size: 12px; letter-spacing: 2px;">LUXURY PERFUMES</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px; text-align: center;">
                      <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px; font-weight: 300;">Thank You, ${name}!</h2>
                      <p style="margin: 0 0 30px; color: #ccc; font-size: 16px; line-height: 1.6;">
                        We have received your message and will get back to you as soon as possible.
                      </p>
                      
                      <div style="padding: 20px; background-color: #0a0a0a; border-left: 3px solid #a87c39; text-align: left; margin-bottom: 30px;">
                        <p style="margin: 0; color: #888; font-size: 12px; letter-spacing: 1px; margin-bottom: 10px;">YOUR MESSAGE</p>
                        <p style="margin: 0; color: #fff; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                      </div>
                      
                      <p style="margin: 0; color: #888; font-size: 14px;">
                        In the meantime, feel free to explore our collection at<br>
                        <a href="https://raynadamperfume.com" style="color: #a87c39; text-decoration: none;">raynadamperfume.com</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; border-top: 1px solid #333;">
                      <p style="margin: 0; color: #a87c39; font-size: 14px; letter-spacing: 2px;">RAYN ADAM PRIVATE LIMITED</p>
                      <p style="margin: 10px 0 0; color: #666; font-size: 12px; line-height: 1.6;">
                        Ward No. 21, Door No. 553/1, Kavumpadi<br>
                        Pallikkal, Tirurangadi, Malappuram – 673634<br>
                        Kerala, India | +91 99466 47442
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

    console.log("Customer confirmation sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Message sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send message" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
