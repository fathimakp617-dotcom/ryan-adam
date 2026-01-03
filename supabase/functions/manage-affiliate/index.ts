import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const { admin_email, admin_token, action, affiliate, affiliateId, bulkData, is_active } = body;

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

    // Validate session token
    if (!await validateSession(supabase, admin_email, admin_token)) {
      console.log(`Invalid session for: ${admin_email}`);
      return new Response(
        JSON.stringify({ error: "Session expired. Please log in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Admin action: ${action} by ${admin_email}`);

    switch (action) {
      case "create": {
        // Check if code already exists
        const { data: existing } = await supabase
          .from("affiliates")
          .select("code")
          .eq("code", affiliate.code.toUpperCase())
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ error: "Affiliate code already exists" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("affiliates")
          .insert({
            name: affiliate.name,
            email: affiliate.email,
            code: affiliate.code.toUpperCase(),
            commission_percent: affiliate.commission_percent || 10,
            coupon_discount_percent: affiliate.coupon_discount_percent || 10,
            is_active: true,
            total_earnings: 0,
            total_referrals: 0,
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, affiliate: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "bulk_create": {
        const { count, prefix, commission_percent, coupon_discount_percent } = bulkData;
        const affiliatesToCreate = [];

        for (let i = 1; i <= count; i++) {
          const code = `${prefix}${String(i).padStart(3, "0")}`;
          affiliatesToCreate.push({
            name: `Affiliate ${code}`,
            email: `affiliate_${code.toLowerCase()}@placeholder.com`,
            code: code.toUpperCase(),
            commission_percent: commission_percent || 10,
            coupon_discount_percent: coupon_discount_percent || 10,
            is_active: true,
            total_earnings: 0,
            total_referrals: 0,
          });
        }

        const { data, error } = await supabase
          .from("affiliates")
          .insert(affiliatesToCreate)
          .select();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, created: data?.length || 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { data, error } = await supabase
          .from("affiliates")
          .update({
            name: affiliate.name,
            email: affiliate.email,
            commission_percent: affiliate.commission_percent,
            coupon_discount_percent: affiliate.coupon_discount_percent,
          })
          .eq("id", affiliateId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, affiliate: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "toggle_active": {
        const { data, error } = await supabase
          .from("affiliates")
          .update({ is_active })
          .eq("id", affiliateId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, affiliate: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { error } = await supabase
          .from("affiliates")
          .delete()
          .eq("id", affiliateId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error in manage-affiliate:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
