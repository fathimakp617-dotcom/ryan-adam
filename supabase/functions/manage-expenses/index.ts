import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { admin_email, admin_token, action, expense, expense_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify admin access
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").toLowerCase().split(",").map(e => e.trim());
    if (!adminEmails.includes(admin_email?.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate session token
    if (!await validateSession(supabase, admin_email, admin_token)) {
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { data: expenses } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
      const { data: routes } = await supabase.from("routes").select("id, name").eq("is_active", true);
      
      // Join routes to expenses
      const expensesWithRoutes = (expenses || []).map(e => ({
        ...e,
        route: routes?.find(r => r.id === e.route_id)
      }));

      return new Response(JSON.stringify({ expenses: expensesWithRoutes, routes }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create") {
      const { error } = await supabase.from("expenses").insert({
        ...expense,
        created_by: admin_email,
        staff_email: admin_email,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      const { error } = await supabase.from("expenses").delete().eq("id", expense_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});