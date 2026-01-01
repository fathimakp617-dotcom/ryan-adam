import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate session token from database
async function validateSession(supabase: any, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  
  const { data: session } = await supabase
    .from("staff_sessions")
    .select("id, expires_at")
    .eq("email", email.toLowerCase())
    .eq("session_token", token)
    .maybeSingle();
  
  if (!session) return false;
  
  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("staff_sessions").delete().eq("id", session.id);
    return false;
  }
  
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    // Get admin credentials from request body
    const { admin_email, admin_token, limit = 50 } = await req.json();

    if (!admin_email || !admin_token) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only admins can view activity logs
    if (!adminEmails.includes(admin_email.toLowerCase())) {
      console.log(`Access denied for non-admin: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    if (!await validateSession(supabaseClient, admin_email, admin_token)) {
      console.log(`Invalid or expired session for: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch activity logs
    const { data: logs, error } = await supabaseClient
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching activity logs:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch activity logs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetched ${logs?.length || 0} activity logs for admin ${admin_email}`);

    return new Response(
      JSON.stringify({ logs }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in get-activity-logs:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
