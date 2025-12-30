import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
    const shippingEmails = shippingEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

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

    // Determine role based on email list
    let role: "admin" | "shipping" | null = null;
    
    if (adminEmails.includes(normalizedEmail)) {
      role = "admin";
    } else if (shippingEmails.includes(normalizedEmail)) {
      role = "shipping";
    }

    // Check if email is in either list
    if (!role) {
      console.log(`Login denied for: ${normalizedEmail} - not in any access list`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password (same password for both roles)
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

    console.log(`${role.toUpperCase()} login successful for: ${normalizedEmail}`);

    // Log the login activity
    try {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      await supabaseClient.from("activity_logs").insert({
        actor_email: normalizedEmail,
        actor_role: role,
        action_type: "login",
        action_details: {
          login_time: new Date().toISOString(),
          session_expiry: new Date(sessionExpiry).toISOString(),
        },
      });
      console.log(`Activity logged: ${role} login for ${normalizedEmail}`);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
      // Don't fail login if activity logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login successful",
        session_token: sessionToken,
        session_expiry: sessionExpiry,
        email: normalizedEmail,
        role: role,
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
