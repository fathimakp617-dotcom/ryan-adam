import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    // Fetch all orders to extract unique customer emails
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_email, customer_name, total, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    console.log(`Found ${orders?.length || 0} orders`);

    // Aggregate customer data
    const customerMap = new Map<string, {
      email: string;
      name: string;
      orderCount: number;
      totalSpent: number;
      lastOrderDate: string;
    }>();

    orders?.forEach((order) => {
      const email = order.customer_email.toLowerCase();
      const existing = customerMap.get(email);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += Number(order.total) || 0;
        // Keep the most recent order date
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at;
          existing.name = order.customer_name || existing.name;
        }
      } else {
        customerMap.set(email, {
          email: order.customer_email,
          name: order.customer_name || "Unknown",
          orderCount: 1,
          totalSpent: Number(order.total) || 0,
          lastOrderDate: order.created_at,
        });
      }
    });

    // Convert map to array and sort by order count (most orders first)
    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.orderCount - a.orderCount
    );

    console.log(`Found ${customers.length} unique customers`);

    return new Response(
      JSON.stringify({ customers }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-admin-customers:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
