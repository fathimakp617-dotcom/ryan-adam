import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Legacy SHA-256 hash for migration (will be replaced on next login)
async function legacyHashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Secure password hashing using PBKDF2 (Web Crypto API compatible)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

// Verify PBKDF2 password
async function verifyPBKDF2Password(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "pbkdf2") return false;
  
  const saltHex = parts[1];
  const expectedHashHex = parts[2];
  
  // Convert salt from hex to bytes
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const computedHashHex = Array.from(hashArray).map((b) => b.toString(16).padStart(2, "0")).join("");
  
  return computedHashHex === expectedHashHex;
}

// Check hash type
function isPBKDF2Hash(hash: string): boolean {
  return hash.startsWith("pbkdf2:");
}

function isBcryptHash(hash: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(hash);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS") || "";
    const shippingEmailsRaw = Deno.env.get("SHIPPING_EMAILS") || "";
    
    const adminEmails = adminEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
    const shippingEmails = shippingEmailsRaw.split(",").map(e => e.trim().toLowerCase()).filter(e => e);

    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // First, check database staff_members table
    const { data: dbStaff } = await supabaseClient
      .from("staff_members")
      .select("id, email, role, password_hash, is_active")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (dbStaff) {
      // Staff member found in database
      if (!dbStaff.is_active) {
        console.log(`Login denied for: ${normalizedEmail} - account deactivated`);
        return new Response(
          JSON.stringify({ error: "Account is deactivated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let passwordValid = false;
      let needsRehash = false;
      
      if (dbStaff.password_hash === "env_based_no_password") {
        // Fallback to ADMIN_PASSWORD from environment for legacy accounts
        passwordValid = adminPassword ? password === adminPassword : false;
        needsRehash = passwordValid; // Rehash on next successful login
        console.log(`Using env-based password verification for: ${normalizedEmail}`);
      } else if (isPBKDF2Hash(dbStaff.password_hash)) {
        // PBKDF2 hash - use our verify function
        passwordValid = await verifyPBKDF2Password(password, dbStaff.password_hash);
      } else if (isBcryptHash(dbStaff.password_hash)) {
        // Bcrypt hash - try legacy SHA-256 comparison or mark for rehash
        // Since bcrypt isn't compatible with Deno Deploy, we'll fallback
        const legacyHash = await legacyHashPassword(password);
        passwordValid = legacyHash === dbStaff.password_hash;
        needsRehash = passwordValid;
        console.log(`Legacy bcrypt detected, trying fallback for: ${normalizedEmail}`);
      } else {
        // Legacy SHA-256 hash - verify and mark for rehash
        const legacyHash = await legacyHashPassword(password);
        passwordValid = legacyHash === dbStaff.password_hash;
        needsRehash = passwordValid; // Rehash on next successful login
        console.log(`Using legacy SHA-256 verification for: ${normalizedEmail}`);
      }
      
      if (!passwordValid) {
        console.log(`Invalid password attempt for DB staff: ${normalizedEmail}`);
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Rehash password to PBKDF2 if needed
      if (needsRehash) {
        try {
          const pbkdf2Hash = await hashPassword(password);
          await supabaseClient
            .from("staff_members")
            .update({ password_hash: pbkdf2Hash })
            .eq("id", dbStaff.id);
          console.log(`Password upgraded to PBKDF2 for: ${normalizedEmail}`);
        } catch (rehashError) {
          console.error("Failed to rehash password:", rehashError);
        }
      }

      // Generate secure session token
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const sessionToken = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
      const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store session in database for validation
      try {
        // Clean up old sessions for this user
        await supabaseClient
          .from("staff_sessions")
          .delete()
          .eq("email", normalizedEmail);
        
        // Insert new session
        await supabaseClient
          .from("staff_sessions")
          .insert({
            email: normalizedEmail,
            session_token: sessionToken,
            expires_at: sessionExpiry.toISOString(),
          });
      } catch (sessionError) {
        console.error("Failed to store session:", sessionError);
      }

      console.log(`${dbStaff.role.toUpperCase()} login successful for DB staff: ${normalizedEmail}`);

      // Log the login activity
      try {
        await supabaseClient.from("activity_logs").insert({
          actor_email: normalizedEmail,
          actor_role: dbStaff.role,
          action_type: "login",
          action_details: {
            login_time: new Date().toISOString(),
            session_expiry: sessionExpiry.toISOString(),
            source: "database",
          },
        });
      } catch (logError) {
        console.error("Failed to log activity:", logError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Login successful",
          session_token: sessionToken,
          session_expiry: sessionExpiry.getTime(),
          email: normalizedEmail,
          role: dbStaff.role,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to environment variable based authentication
    if (!adminPassword) {
      console.error("ADMIN_PASSWORD not configured and user not in database");
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine role based on email list
    let role: "admin" | "shipping" | null = null;
    
    if (adminEmails.includes(normalizedEmail)) {
      role = "admin";
    } else if (shippingEmails.includes(normalizedEmail)) {
      role = "shipping";
    }

    // Check if email is in either list
    if (!role) {
      console.log(`Login denied for: ${normalizedEmail} - not in any access list`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify password (same password for both roles from env)
    if (password !== adminPassword) {
      console.log(`Invalid password attempt for: ${normalizedEmail}`);
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secure session token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const sessionToken = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
    const sessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session in database for validation
    try {
      // Clean up old sessions for this user
      await supabaseClient
        .from("staff_sessions")
        .delete()
        .eq("email", normalizedEmail);
      
      // Insert new session
      await supabaseClient
        .from("staff_sessions")
        .insert({
          email: normalizedEmail,
          session_token: sessionToken,
          expires_at: sessionExpiry.toISOString(),
        });
    } catch (sessionError) {
      console.error("Failed to store session:", sessionError);
    }

    console.log(`${role.toUpperCase()} login successful for: ${normalizedEmail}`);

    // Log the login activity
    try {
      await supabaseClient.from("activity_logs").insert({
        actor_email: normalizedEmail,
        actor_role: role,
        action_type: "login",
        action_details: {
          login_time: new Date().toISOString(),
          session_expiry: sessionExpiry.toISOString(),
          source: "environment",
        },
      });
      console.log(`Activity logged: ${role} login for ${normalizedEmail}`);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Login successful",
        session_token: sessionToken,
        session_expiry: sessionExpiry.getTime(),
        email: normalizedEmail,
        role: role,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in verify-admin-password:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
