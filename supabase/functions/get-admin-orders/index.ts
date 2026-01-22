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
  
  // Check if session is expired
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
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
    const shippingEmails = shippingEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
    const allowedEmails = [...adminEmails, ...shippingEmails];

    // Get admin credentials from request body
    const body = await req.json().catch(() => ({}));
    const adminEmail = body.admin_email;
    const adminToken = body.admin_token;

    const page = Math.max(1, Number(body.page ?? 1));
    const pageSizeRaw = Number(body.page_size ?? 1000);
    const pageSize = Math.min(1000, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 1000));

    if (!adminEmail || !adminToken) {
      console.log("Missing credentials in body");
      return new Response(JSON.stringify({ error: "Access denied" }), { 
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Verify email is in allowed list (admin or shipping)
    if (!allowedEmails.includes(adminEmail.toLowerCase())) {
      console.log(`Email not in allowed list: ${adminEmail}`);
      return new Response(JSON.stringify({ error: "Access denied" }), { 
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    if (!await validateSession(supabase, adminEmail, adminToken)) {
      console.log(`Invalid or expired session for: ${adminEmail}`);
      return new Response(JSON.stringify({ error: "Session expired. Please log in again." }), { 
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    console.log(`Access granted for: ${adminEmail}`);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (ordersError) throw ordersError;

    const hasMore = (orders?.length || 0) === pageSize;

    return new Response(JSON.stringify({ orders: orders || [], page, page_size: pageSize, has_more: hasMore }), { 
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), { 
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
