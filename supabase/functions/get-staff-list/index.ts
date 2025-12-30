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
    const { adminEmail } = await req.json();

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmails = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmails = Deno.env.get("SHIPPING_EMAILS") || "";

    // Verify admin access
    const authorizedAdmins = adminEmails.split(",").map((e) => e.trim().toLowerCase());
    if (!authorizedAdmins.includes(adminEmail.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse staff emails
    const adminList = adminEmails.split(",").map((e) => e.trim()).filter(Boolean);
    const shippingList = shippingEmails.split(",").map((e) => e.trim()).filter(Boolean);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch login activity for each staff member
    const { data: loginLogs, error: logsError } = await supabase
      .from("activity_logs")
      .select("actor_email, created_at")
      .eq("action_type", "login")
      .order("created_at", { ascending: false });

    if (logsError) {
      console.error("Error fetching login logs:", logsError);
    }

    // Build staff list with login stats
    const staffMap = new Map<string, { lastLogin?: string; loginCount: number; role: string }>();

    // Add admins
    for (const email of adminList) {
      staffMap.set(email.toLowerCase(), { loginCount: 0, role: "admin" });
    }

    // Add shipping staff
    for (const email of shippingList) {
      const existing = staffMap.get(email.toLowerCase());
      if (!existing) {
        staffMap.set(email.toLowerCase(), { loginCount: 0, role: "shipping" });
      }
    }

    // Process login logs
    if (loginLogs) {
      for (const log of loginLogs) {
        const email = log.actor_email.toLowerCase();
        const existing = staffMap.get(email);
        if (existing) {
          existing.loginCount++;
          if (!existing.lastLogin) {
            existing.lastLogin = log.created_at;
          }
        }
      }
    }

    // Convert to array
    const staff = Array.from(staffMap.entries()).map(([email, data]) => ({
      email,
      role: data.role,
      lastLogin: data.lastLogin,
      loginCount: data.loginCount,
    }));

    // Sort by role (admin first) then by email
    staff.sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return a.email.localeCompare(b.email);
    });

    const stats = {
      totalStaff: staff.length,
      adminCount: staff.filter((s) => s.role === "admin").length,
      shippingCount: staff.filter((s) => s.role === "shipping").length,
    };

    console.log(`Fetched ${staff.length} staff members`);

    return new Response(
      JSON.stringify({ staff, stats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in get-staff-list:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
