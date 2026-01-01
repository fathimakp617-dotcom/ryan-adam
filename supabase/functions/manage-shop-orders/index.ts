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
    const { admin_email, admin_token, action, shop_order, order_id, status } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify staff access (admin or shipping only)
    const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").toLowerCase().split(",").map(e => e.trim());
    const shippingEmails = (Deno.env.get("SHIPPING_EMAILS") || "").toLowerCase().split(",").map(e => e.trim());
    const allStaff = [...adminEmails, ...shippingEmails];
    
    if (!allStaff.includes(admin_email?.toLowerCase())) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { data: shop_orders } = await supabase.from("shop_orders").select("*").order("order_date", { ascending: false });
      return new Response(JSON.stringify({ shop_orders: shop_orders || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "create") {
      const { error } = await supabase.from("shop_orders").insert({
        ...shop_order,
        created_by: admin_email,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "update_status") {
      const { error } = await supabase.from("shop_orders").update({ status }).eq("id", order_id);
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