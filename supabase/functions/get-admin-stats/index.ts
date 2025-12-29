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

    // Get admin credentials and filters from request body
    const body = await req.json().catch(() => ({}));
    const adminEmail = body.admin_email;
    const adminToken = body.admin_token;
    const dateFrom = body.date_from;
    const dateTo = body.date_to;

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
    console.log(`Date filter: ${dateFrom} to ${dateTo}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch all orders
    const { data: allOrders } = await supabase.from("orders").select("*");
    
    // Filter orders by date if provided
    let filteredOrders = allOrders || [];
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= fromDate);
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredOrders = filteredOrders.filter(o => new Date(o.created_at) <= toDate);
    }

    // Calculate stats for filtered orders
    const stats = {
      total: filteredOrders.length,
      pending: filteredOrders.filter(o => o.order_status === "pending").length,
      processing: filteredOrders.filter(o => o.order_status === "processing").length,
      shipped: filteredOrders.filter(o => o.order_status === "shipped").length,
      delivered: filteredOrders.filter(o => o.order_status === "delivered").length,
      cancelled: filteredOrders.filter(o => o.order_status === "cancelled").length,
      totalRevenue: filteredOrders
        .filter(o => o.order_status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0),
    };

    // Calculate all-time stats (without date filter)
    const allTimeStats = {
      total: allOrders?.length || 0,
      totalRevenue: allOrders
        ?.filter(o => o.order_status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    };

    // Get monthly breakdown for the current year
    const currentYear = new Date().getFullYear();
    const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59, 999);
      
      const monthOrders = (allOrders || []).filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const revenue = monthOrders
        .filter(o => o.order_status !== "cancelled")
        .reduce((sum, o) => sum + (o.total || 0), 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleString('en-US', { month: 'short' }),
        revenue,
        orders: monthOrders.length,
      });
    }

    // Get recent orders (always from all orders, sorted by date)
    const recentOrders = (allOrders || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    return new Response(JSON.stringify({ 
      stats, 
      allTimeStats,
      monthlyRevenue,
      recentOrders,
      dateRange: { from: dateFrom, to: dateTo }
    }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch stats" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
