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
    const body = await req.json().catch(() => ({}));
    const email = body.email;
    const name = body.name;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const emailLower = email.toLowerCase();

    // First check if staff member exists
    const { data: existing } = await supabase
      .from("staff_members")
      .select("id")
      .eq("email", emailLower)
      .maybeSingle();

    let data;
    let error;

    if (existing) {
      // Update existing staff member
      const result = await supabase
        .from("staff_members")
        .update({ name: name || null })
        .eq("email", emailLower)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Check if email is in admin or shipping emails (environment-based staff)
      const adminEmails = (Deno.env.get("ADMIN_EMAILS") || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);
      const shippingEmails = (Deno.env.get("SHIPPING_EMAILS") || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);
      
      let role = "";
      if (adminEmails.includes(emailLower)) {
        role = "admin";
      } else if (shippingEmails.includes(emailLower)) {
        role = "shipping";
      }

      if (!role) {
        return new Response(
          JSON.stringify({ error: "Staff member not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create staff member record for environment-based staff
      const result = await supabase
        .from("staff_members")
        .insert({
          email: emailLower,
          name: name || null,
          role: role,
          password_hash: "env_based_no_password",
          is_active: true,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      throw error;
    }

    console.log(`Updated name for ${emailLower} to: ${name}`);

    return new Response(
      JSON.stringify({ success: true, staff: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in update-staff-name:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
