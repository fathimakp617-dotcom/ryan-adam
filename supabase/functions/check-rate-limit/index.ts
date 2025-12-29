import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limit configuration
const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMinutes: 15, blockMinutes: 30 },
  signup: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
  password_reset: { maxAttempts: 3, windowMinutes: 60, blockMinutes: 60 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const { identifier, attempt_type, action } = await req.json();

    if (!identifier || !attempt_type) {
      return new Response(
        JSON.stringify({ error: "Missing identifier or attempt_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const config = RATE_LIMITS[attempt_type as keyof typeof RATE_LIMITS] || RATE_LIMITS.login;
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Check current rate limit status
    const { data: existing, error: fetchError } = await supabase
      .from("auth_rate_limits")
      .select("*")
      .eq("identifier", normalizedIdentifier)
      .eq("attempt_type", attempt_type)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching rate limit:", fetchError);
      throw fetchError;
    }

    const now = new Date();

    // Check if currently blocked
    if (existing?.blocked_until) {
      const blockedUntil = new Date(existing.blocked_until);
      if (blockedUntil > now) {
        const remainingMinutes = Math.ceil((blockedUntil.getTime() - now.getTime()) / 60000);
        console.log(`Rate limited: ${normalizedIdentifier} blocked for ${remainingMinutes} more minutes`);
        return new Response(
          JSON.stringify({
            allowed: false,
            blocked: true,
            remaining_minutes: remainingMinutes,
            message: `Too many attempts. Please try again in ${remainingMinutes} minutes.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If action is "check", just return current status
    if (action === "check") {
      const attemptsRemaining = existing
        ? Math.max(0, config.maxAttempts - existing.attempts)
        : config.maxAttempts;

      return new Response(
        JSON.stringify({
          allowed: true,
          attempts_remaining: attemptsRemaining,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If action is "record_failure", increment attempts
    if (action === "record_failure") {
      const windowStart = new Date(now.getTime() - config.windowMinutes * 60000);

      if (existing) {
        const firstAttempt = new Date(existing.first_attempt_at);

        // If first attempt is outside window, reset counter
        if (firstAttempt < windowStart) {
          await supabase
            .from("auth_rate_limits")
            .update({
              attempts: 1,
              first_attempt_at: now.toISOString(),
              blocked_until: null,
              updated_at: now.toISOString(),
            })
            .eq("id", existing.id);

          return new Response(
            JSON.stringify({ allowed: true, attempts_remaining: config.maxAttempts - 1 }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Increment attempts
        const newAttempts = existing.attempts + 1;
        const shouldBlock = newAttempts >= config.maxAttempts;
        const blockedUntil = shouldBlock
          ? new Date(now.getTime() + config.blockMinutes * 60000).toISOString()
          : null;

        await supabase
          .from("auth_rate_limits")
          .update({
            attempts: newAttempts,
            blocked_until: blockedUntil,
            updated_at: now.toISOString(),
          })
          .eq("id", existing.id);

        if (shouldBlock) {
          console.log(`Blocking ${normalizedIdentifier} for ${config.blockMinutes} minutes after ${newAttempts} attempts`);
          return new Response(
            JSON.stringify({
              allowed: false,
              blocked: true,
              remaining_minutes: config.blockMinutes,
              message: `Too many attempts. Please try again in ${config.blockMinutes} minutes.`,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            allowed: true,
            attempts_remaining: config.maxAttempts - newAttempts,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // First attempt - create record
        await supabase.from("auth_rate_limits").insert({
          identifier: normalizedIdentifier,
          attempt_type,
          attempts: 1,
          first_attempt_at: now.toISOString(),
        });

        return new Response(
          JSON.stringify({ allowed: true, attempts_remaining: config.maxAttempts - 1 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If action is "reset" (successful auth), clear the record
    if (action === "reset") {
      if (existing) {
        await supabase.from("auth_rate_limits").delete().eq("id", existing.id);
      }
      return new Response(
        JSON.stringify({ allowed: true, reset: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in check-rate-limit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
