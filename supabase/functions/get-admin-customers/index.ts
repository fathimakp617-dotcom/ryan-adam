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

    const { admin_email } = await req.json();

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

    // Fetch registered users from auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Error fetching users:", authError);
      throw authError;
    }

    // Fetch profiles to get phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, phone");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Create a map of user_id to phone
    const phoneMap = new Map<string, string>();
    if (profiles) {
      profiles.forEach((p) => {
        if (p.phone) {
          phoneMap.set(p.user_id, p.phone);
        }
      });
    }

    // Map to customer data with email, phone, and registration date
    const customers = authUsers.users.map((user) => ({
      email: user.email || "No email",
      phone: phoneMap.get(user.id) || null,
      created_at: user.created_at,
    })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log(`Found ${customers.length} registered customers`);

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
