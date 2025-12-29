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
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not configured");
      return new Response(
        JSON.stringify({ error: "Admin access not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is in admin list
    if (!adminEmails.includes(normalizedEmail)) {
      console.log(`Admin login denied for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password
    if (password !== adminPassword) {
      console.log(`Invalid password attempt for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate session token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const sessionToken = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
    const sessionExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    console.log(`Admin login successful for: ${normalizedEmail}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login successful",
        session_token: sessionToken,
        session_expiry: sessionExpiry,
        email: normalizedEmail,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in verify-admin-password:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
