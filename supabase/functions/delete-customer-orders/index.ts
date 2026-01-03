import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteCustomerRequest {
  customer_email: string;
  admin_email: string;
  admin_token: string;
}

// Session validation helper
async function validateSession(supabase: any, email: string, token: string): Promise<boolean> {
  if (!email || !token) return false;
  
  try {
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
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
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

    const body: DeleteCustomerRequest = await req.json();
    const { admin_email, admin_token, customer_email } = body;

    if (!admin_email || !admin_token) {
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminEmails.includes(admin_email.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Access denied. Admin privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate session token
    if (!await validateSession(supabaseClient, admin_email, admin_token)) {
      console.log(`Invalid session for: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer_email) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get count of orders to delete
    const { data: orders, error: countError } = await supabaseClient
      .from("orders")
      .select("id")
      .eq("customer_email", customer_email);

    if (countError) {
      console.error("Count error:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch customer orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderCount = orders?.length || 0;

    if (orderCount === 0) {
      return new Response(
        JSON.stringify({ error: "No orders found for this customer" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete all orders for this customer
    const { error: deleteError } = await supabaseClient
      .from("orders")
      .delete()
      .eq("customer_email", customer_email);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete customer orders" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`${orderCount} orders deleted for customer ${customer_email} by ${admin_email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Deleted ${orderCount} orders for ${customer_email}`,
        deleted_count: orderCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error deleting customer orders:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete customer orders";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
