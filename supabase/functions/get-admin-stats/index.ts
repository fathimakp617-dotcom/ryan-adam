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
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    // Get admin credentials from request body
    const body = await req.json().catch(() => ({}));
    const adminEmail = body.admin_email;
    const adminToken = body.admin_token;

    if (!adminEmail || !adminToken) {
      console.log("Missing admin credentials in body");
      return new Response(JSON.stringify({ error: "Access denied" }), { 
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Verify admin email is in allowed list
    if (!adminEmails.includes(adminEmail.toLowerCase())) {
      console.log(`Admin email not in allowed list: ${adminEmail}`);
      return new Response(JSON.stringify({ error: "Access denied" }), { 
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Admin access granted for: ${adminEmail}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: orders } = await supabase.from("orders").select("*");

    const stats = {
      total: orders?.length || 0,
      pending: orders?.filter(o => o.order_status === "pending").length || 0,
      processing: orders?.filter(o => o.order_status === "processing").length || 0,
      shipped: orders?.filter(o => o.order_status === "shipped").length || 0,
      delivered: orders?.filter(o => o.order_status === "delivered").length || 0,
      cancelled: orders?.filter(o => o.order_status === "cancelled").length || 0,
      totalRevenue: orders?.filter(o => o.order_status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    };

    const recentOrders = orders?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5) || [];

    return new Response(JSON.stringify({ stats, recentOrders }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch stats" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
