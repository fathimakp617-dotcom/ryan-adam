import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSession } from "../_shared/session-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword, adminEmail, adminToken } = await req.json();

    if (!email || !newPassword || !adminEmail || !adminToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate admin session
    const isValid = await validateSession(supabaseAdmin, adminEmail, adminToken);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid admin session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check admin authorization
    const adminEmailsStr = Deno.env.get("ADMIN_EMAILS") || "";
    const adminEmails = adminEmailsStr.split(",").map((e: string) => e.trim().toLowerCase());
    if (!adminEmails.includes(adminEmail.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - not an admin" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find the user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers();
    const targetUser = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: "No user found with this email" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to reset password" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Admin ${adminEmail} reset password for ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in admin-reset-password:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
