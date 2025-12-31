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
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const emailLower = email.toLowerCase();

    // Get staff member info
    const { data: staffMember, error: staffError } = await supabase
      .from("staff_members")
      .select("id, email, name, role, is_active, created_at")
      .eq("email", emailLower)
      .maybeSingle();

    if (staffError) throw staffError;

    // Get login stats from activity logs
    const { data: loginLogs, error: logError } = await supabase
      .from("activity_logs")
      .select("created_at")
      .eq("actor_email", emailLower)
      .eq("action_type", "login")
      .order("created_at", { ascending: false });

    if (logError) throw logError;

    const loginCount = loginLogs?.length || 0;
    const lastLogin = loginLogs?.[0]?.created_at || null;

    // Get order stats
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("order_status");

    if (ordersError) throw ordersError;

    const orderStats = {
      pending: orders?.filter((o) => o.order_status === "pending").length || 0,
      processing: orders?.filter((o) => o.order_status === "processing").length || 0,
      shipped: orders?.filter((o) => o.order_status === "shipped").length || 0,
      delivered: orders?.filter((o) => o.order_status === "delivered").length || 0,
      total: orders?.length || 0,
    };

    // Get notifications where this staff is a recipient
    const { data: notifications, error: notifError } = await supabase
      .from("staff_notifications")
      .select("*")
      .contains("recipients", [emailLower])
      .order("sent_at", { ascending: false })
      .limit(20);

    if (notifError) throw notifError;

    const staff = staffMember ? {
      ...staffMember,
      login_count: loginCount,
      last_login: lastLogin,
    } : {
      id: `env-${emailLower}`,
      email: emailLower,
      name: null,
      role: "shipping",
      is_active: true,
      created_at: null,
      login_count: loginCount,
      last_login: lastLogin,
    };

    console.log(`Fetched account data for ${emailLower}`);

    return new Response(
      JSON.stringify({
        staff,
        stats: orderStats,
        notifications: notifications || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-shipping-account:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
