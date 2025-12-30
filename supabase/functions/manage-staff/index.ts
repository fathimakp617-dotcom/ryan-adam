import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, admin_email, email, role, password, staff_id, staff_email } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminEmailsEnv = Deno.env.get("ADMIN_EMAILS") || "";
    const mainAdmin = "anfaslenova@gmail.com";

    // Verify admin access
    const authorizedAdmins = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase());
    if (!authorizedAdmins.includes(admin_email.toLowerCase())) {
      // Also check database for admin
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: dbAdmin } = await supabase
        .from("staff_members")
        .select("role")
        .eq("email", admin_email.toLowerCase())
        .eq("is_active", true)
        .eq("role", "admin")
        .maybeSingle();
      
      if (!dbAdmin) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    switch (action) {
      case "list": {
        const shippingEmailsEnv = Deno.env.get("SHIPPING_EMAILS") || "";
        
        // Parse environment emails
        const envAdmins = adminEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
        const envShipping = shippingEmailsEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

        // Get staff from database
        const { data: dbStaff, error } = await supabase
          .from("staff_members")
          .select("id, email, role, is_active, created_at, created_by, updated_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get login stats
        const { data: loginLogs } = await supabase
          .from("activity_logs")
          .select("actor_email, created_at")
          .eq("action_type", "login")
          .order("created_at", { ascending: false });

        // Process login stats
        const loginStats = new Map<string, { lastLogin?: string; loginCount: number }>();
        if (loginLogs) {
          for (const log of loginLogs) {
            const emailLower = log.actor_email.toLowerCase();
            const existing = loginStats.get(emailLower);
            if (existing) {
              existing.loginCount++;
            } else {
              loginStats.set(emailLower, { lastLogin: log.created_at, loginCount: 1 });
            }
          }
        }

        // Track emails already in database
        const dbEmails = new Set((dbStaff || []).map((s) => s.email.toLowerCase()));

        // Create env-based staff entries (not in database)
        const envStaff: any[] = [];
        
        // Add env admins not in database
        for (const email of envAdmins) {
          if (!dbEmails.has(email)) {
            envStaff.push({
              id: `env-admin-${email}`,
              email,
              role: "admin",
              is_active: true,
              created_at: null,
              created_by: "System (Environment)",
              source: "environment",
              is_protected: email === mainAdmin,
              lastLogin: loginStats.get(email)?.lastLogin,
              loginCount: loginStats.get(email)?.loginCount || 0,
            });
          }
        }

        // Add env shipping not in database
        for (const email of envShipping) {
          if (!dbEmails.has(email) && !envAdmins.includes(email)) {
            envStaff.push({
              id: `env-shipping-${email}`,
              email,
              role: "shipping",
              is_active: true,
              created_at: null,
              created_by: "System (Environment)",
              source: "environment",
              is_protected: false,
              lastLogin: loginStats.get(email)?.lastLogin,
              loginCount: loginStats.get(email)?.loginCount || 0,
            });
          }
        }

        // Enrich database staff with login stats and protection status
        const enrichedDbStaff = (dbStaff || []).map((member) => ({
          ...member,
          source: "database",
          is_protected: member.email.toLowerCase() === mainAdmin,
          lastLogin: loginStats.get(member.email.toLowerCase())?.lastLogin,
          loginCount: loginStats.get(member.email.toLowerCase())?.loginCount || 0,
        }));

        // Combine: env staff first (main admin at top), then database staff
        const allStaff = [
          ...envStaff.sort((a, b) => (a.is_protected ? -1 : 1)),
          ...enrichedDbStaff,
        ];

        const stats = {
          totalStaff: allStaff.length,
          adminCount: allStaff.filter((s) => s.role === "admin").length,
          shippingCount: allStaff.filter((s) => s.role === "shipping").length,
          activeCount: allStaff.filter((s) => s.is_active).length,
        };

        return new Response(
          JSON.stringify({ staff: allStaff, stats }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_notifications": {
        if (!staff_email) {
          return new Response(
            JSON.stringify({ error: "Staff email is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get notifications for this staff member
        const { data: notifications, error } = await supabase
          .from("staff_notifications")
          .select("*")
          .eq("staff_email", staff_email.toLowerCase())
          .order("sent_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        return new Response(
          JSON.stringify({ notifications: notifications || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add": {
        if (!email || !role || !password) {
          return new Response(
            JSON.stringify({ error: "Email, role, and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!["admin", "shipping"].includes(role)) {
          return new Response(
            JSON.stringify({ error: "Role must be 'admin' or 'shipping'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if email already exists
        const { data: existing } = await supabase
          .from("staff_members")
          .select("id")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existing) {
          return new Response(
            JSON.stringify({ error: "Staff member with this email already exists" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const passwordHash = await hashPassword(password);

        const { data, error } = await supabase
          .from("staff_members")
          .insert({
            email: email.toLowerCase().trim(),
            role,
            password_hash: passwordHash,
            created_by: admin_email,
          })
          .select()
          .single();

        if (error) throw error;

        console.log(`Staff member added: ${email} as ${role} by ${admin_email}`);

        // Send email notification (fire and forget)
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-staff-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: "account_created",
              staff_email: email.toLowerCase().trim(),
              staff_role: role,
              created_by: admin_email,
              temporary_password: password,
            }),
          });
          console.log("Staff notification email sent");
        } catch (emailError) {
          console.error("Failed to send staff notification:", emailError);
        }

        return new Response(
          JSON.stringify({ success: true, staff: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_password": {
        if (!staff_id || !password) {
          return new Response(
            JSON.stringify({ error: "Staff ID and password are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: "Password must be at least 6 characters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const passwordHash = await hashPassword(password);

        // Get staff member info for notification
        const { data: staffMember } = await supabase
          .from("staff_members")
          .select("email, role, is_active")
          .eq("id", staff_id)
          .single();

        const { error } = await supabase
          .from("staff_members")
          .update({ password_hash: passwordHash })
          .eq("id", staff_id);

        if (error) throw error;

        console.log(`Password updated for staff ${staff_id} by ${admin_email}`);

        // Send password change notification (only if staff is active)
        if (staffMember && staffMember.is_active) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-staff-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${serviceRoleKey}`,
              },
              body: JSON.stringify({
                type: "password_changed",
                staff_email: staffMember.email,
                staff_role: staffMember.role,
                created_by: admin_email,
              }),
            });
            console.log("Password change notification email sent");
          } catch (emailError) {
            console.error("Failed to send password change notification:", emailError);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "toggle_active": {
        if (!staff_id) {
          return new Response(
            JSON.stringify({ error: "Staff ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get current status
        const { data: current } = await supabase
          .from("staff_members")
          .select("email, role, is_active")
          .eq("id", staff_id)
          .single();

        if (!current) {
          return new Response(
            JSON.stringify({ error: "Staff member not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if trying to block main admin
        if (current.email.toLowerCase() === mainAdmin) {
          return new Response(
            JSON.stringify({ error: "Cannot block the main admin account" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const newStatus = !current.is_active;

        const { error } = await supabase
          .from("staff_members")
          .update({ is_active: newStatus })
          .eq("id", staff_id);

        if (error) throw error;

        console.log(`Staff ${staff_id} (${current.email}) ${newStatus ? "unblocked" : "blocked"} by ${admin_email}`);

        // Send block/unblock notification to main admin only (not to the blocked staff)
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-staff-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({
              type: newStatus ? "account_unblocked" : "account_blocked",
              staff_email: current.email,
              staff_role: current.role,
              created_by: admin_email,
            }),
          });
          console.log(`Staff ${newStatus ? "unblock" : "block"} notification sent`);
        } catch (emailError) {
          console.error("Failed to send notification:", emailError);
        }

        return new Response(
          JSON.stringify({ success: true, is_active: newStatus }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        if (!staff_id) {
          return new Response(
            JSON.stringify({ error: "Staff ID is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check if trying to delete main admin
        const { data: staffToDelete } = await supabase
          .from("staff_members")
          .select("email")
          .eq("id", staff_id)
          .single();

        if (staffToDelete && staffToDelete.email.toLowerCase() === mainAdmin) {
          return new Response(
            JSON.stringify({ error: "Cannot delete the main admin account" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("staff_members")
          .delete()
          .eq("id", staff_id);

        if (error) throw error;

        console.log(`Staff ${staff_id} deleted by ${admin_email}`);

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
    console.error("Error in manage-staff:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
