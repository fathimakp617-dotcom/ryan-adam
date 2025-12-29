import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminEmailsEnv = Deno.env.get("ADMIN_EMAILS") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const { admin_email, admin_token } = await req.json();

    // Verify admin access
    const allowedEmails = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase());
    if (!admin_email || !allowedEmails.includes(admin_email.toLowerCase())) {
      console.log("Unauthorized admin access attempt:", admin_email);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all affiliates
    const { data: affiliates, error: affiliatesError } = await supabase
      .from("affiliates")
      .select("*")
      .order("created_at", { ascending: false });

    if (affiliatesError) {
      console.error("Error fetching affiliates:", affiliatesError);
      throw affiliatesError;
    }

    // Fetch orders with affiliate codes to calculate revenue
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("affiliate_code, total, order_status")
      .not("affiliate_code", "is", null);

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
    }

    // Calculate stats
    const affiliatesList = affiliates || [];
    const ordersList = orders || [];

    // Calculate revenue per affiliate
    const affiliateRevenue: Record<string, number> = {};
    ordersList.forEach((order) => {
      if (order.affiliate_code && order.order_status !== "cancelled") {
        const code = order.affiliate_code.toUpperCase();
        affiliateRevenue[code] = (affiliateRevenue[code] || 0) + (order.total || 0);
      }
    });

    // Update affiliates with calculated revenue
    const enrichedAffiliates = affiliatesList.map((aff) => ({
      ...aff,
      calculated_revenue: affiliateRevenue[aff.code.toUpperCase()] || 0,
    }));

    const totalRevenue = Object.values(affiliateRevenue).reduce((sum, rev) => sum + rev, 0);
    const totalCommissions = enrichedAffiliates.reduce((sum, aff) => {
      const revenue = affiliateRevenue[aff.code.toUpperCase()] || 0;
      return sum + (revenue * (aff.commission_percent || 10) / 100);
    }, 0);

    const stats = {
      totalAffiliates: affiliatesList.length,
      activeAffiliates: affiliatesList.filter((a) => a.is_active).length,
      totalReferrals: affiliatesList.reduce((sum, a) => sum + (a.total_referrals || 0), 0),
      totalRevenue,
      totalCommissions,
    };

    console.log(`Found ${affiliatesList.length} affiliates`);

    return new Response(
      JSON.stringify({ affiliates: enrichedAffiliates, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-admin-affiliates:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
