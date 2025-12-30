import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);
    
    const shippingEmails = shippingEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ is_admin: false, is_shipping: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isAdmin = adminEmails.includes(normalizedEmail);
    const isShipping = shippingEmails.includes(normalizedEmail);

    console.log(`Email check for ${normalizedEmail}: admin=${isAdmin}, shipping=${isShipping}`);

    return new Response(
      JSON.stringify({ 
        is_admin: isAdmin, 
        is_shipping: isShipping,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in check-staff-email:", error);
    return new Response(
      JSON.stringify({ is_admin: false, is_shipping: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
