import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Always use current origin - works on localhost, Lovable preview, or production domain
const getAppOrigin = () => window.location.origin;

// When using the custom OTP flow, verification redirects via an auth action_link.
// We store profile seed data during signup and persist it right after the session is established.
const PENDING_PROFILE_SEED_KEY = "pending_profile_seed_v1";
const PENDING_PROFILE_SEED_DEBUG_KEY = "pending_profile_seed_debug_v1";

type PendingProfileSeed = {
  first_name: string;
  last_name: string;
  phone: string;
  saved_address: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmailOtp: (email: string) => Promise<{ error: Error | null }>;
  sendPasswordResetOtp: (email: string) => Promise<{ error: Error | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  verifyPasswordResetOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Rate limiting helper
const checkRateLimit = async (identifier: string, attemptType: string, action: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("check-rate-limit", {
      body: { identifier, attempt_type: attemptType, action },
    });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Rate limit check failed:", err);
    // Allow operation if rate limit check fails (fail open for UX)
    return { allowed: true };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const pendingSeedProcessedRef = useRef(false);

  const persistPendingProfileSeedIfAny = async (session: Session | null) => {
    if (!session?.user) return;
    if (pendingSeedProcessedRef.current) return;

    const raw = localStorage.getItem(PENDING_PROFILE_SEED_KEY);
    if (!raw) return;

    pendingSeedProcessedRef.current = true;
    try {
      // Diagnostics: helps trace why signup address sometimes doesn't persist.
      localStorage.setItem(
        PENDING_PROFILE_SEED_DEBUG_KEY,
        JSON.stringify({ stage: "seed_found", at: new Date().toISOString(), user_id: session.user.id })
      );

      const seed = JSON.parse(raw) as PendingProfileSeed;
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            first_name: seed.first_name,
            last_name: seed.last_name,
            phone: seed.phone,
            saved_address: seed.saved_address,
          },
          { onConflict: "user_id" }
        );

      if (error) {
        console.error("Failed to persist pending signup profile seed:", error);
        localStorage.setItem(
          PENDING_PROFILE_SEED_DEBUG_KEY,
          JSON.stringify({
            stage: "upsert_error",
            at: new Date().toISOString(),
            user_id: session.user.id,
            message: error.message,
            code: (error as any)?.code,
          })
        );
        // Allow retry on next auth change
        pendingSeedProcessedRef.current = false;
        return;
      }

      localStorage.removeItem(PENDING_PROFILE_SEED_KEY);
      localStorage.setItem(
        PENDING_PROFILE_SEED_DEBUG_KEY,
        JSON.stringify({ stage: "upsert_success", at: new Date().toISOString(), user_id: session.user.id })
      );
    } catch (e) {
      console.error("Error processing pending signup profile seed:", e);
      localStorage.setItem(
        PENDING_PROFILE_SEED_DEBUG_KEY,
        JSON.stringify({ stage: "exception", at: new Date().toISOString(), message: (e as any)?.message })
      );
      pendingSeedProcessedRef.current = false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // If we have a pending signup seed (address/phone), persist it right after session creation.
        // This is critical for the custom OTP flow that redirects via action_link.
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          void persistPendingProfileSeedIfAny(session);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Also attempt on initial load in case the page was refreshed after signup.
      void persistPendingProfileSeedIfAny(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    // Check rate limit first
    const rateCheck = await checkRateLimit(email, "signup", "check");
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.message || "Too many signup attempts. Please try again later.") };
    }

    const redirectUrl = `${getAppOrigin()}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        }
      }
    });

    if (error) {
      // Record failed attempt
      await checkRateLimit(email, "signup", "record_failure");
    } else {
      // Reset rate limit on success
      await checkRateLimit(email, "signup", "reset");
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    // Check rate limit first
    const rateCheck = await checkRateLimit(email, "login", "check");
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.message || "Too many login attempts. Please try again later.") };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed attempt
      await checkRateLimit(email, "login", "record_failure");
    } else {
      // Reset rate limit on success
      await checkRateLimit(email, "login", "reset");
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAppOrigin()}/`,
      },
    });
    return { error };
  };

  const signInWithEmailOtp = async (email: string) => {
    // Check rate limit first
    const rateCheck = await checkRateLimit(email, "login", "check");
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.message || "Too many login attempts. Please try again later.") };
    }

    try {
      // Use custom edge function for branded OTP email via Resend
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        await checkRateLimit(email, "login", "record_failure");
        return { error: new Error(errorData.error || "Failed to send OTP") };
      }

      return { error: null };
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      await checkRateLimit(email, "login", "record_failure");
      return { error: new Error(err.message || "Failed to send OTP") };
    }
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-custom-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, otp: token, otp_type: "login" }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        await checkRateLimit(email, "login", "record_failure");
        return { error: new Error(data.error || "Invalid or expired OTP") };
      }

      // Most reliable: follow the auth action link to complete session creation.
      if (data.action_link) {
        await checkRateLimit(email, "login", "reset");
        window.location.assign(data.action_link as string);
        return { error: null };
      }

      await checkRateLimit(email, "login", "record_failure");
      return { error: new Error("Authentication link missing") };
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      await checkRateLimit(email, "login", "record_failure");
      return { error: new Error(err.message || "Failed to verify OTP") };
    }
  };

  const sendPasswordResetOtp = async (email: string) => {
    // Check rate limit first
    const rateCheck = await checkRateLimit(email, "password_reset", "check");
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.message || "Too many reset attempts. Please try again later.") };
    }

    try {
      // Use custom edge function for 6-digit password reset OTP via Resend
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-password-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        await checkRateLimit(email, "password_reset", "record_failure");
        return { error: new Error(errorData.error || "Failed to send OTP") };
      }

      return { error: null };
    } catch (err: any) {
      console.error("Error sending password reset OTP:", err);
      await checkRateLimit(email, "password_reset", "record_failure");
      return { error: new Error(err.message || "Failed to send OTP") };
    }
  };

  const verifyPasswordResetOtp = async (email: string, token: string) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-custom-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, otp: token, otp_type: "password_reset" }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        await checkRateLimit(email, "password_reset", "record_failure");
        return { error: new Error(data.error || "Invalid or expired OTP") };
      }

      await checkRateLimit(email, "password_reset", "reset");

      // Follow the action link to create a session so updateUser works
      if (data.action_link) {
        window.location.assign(data.action_link as string);
        return { error: null };
      }

      return { error: null };
    } catch (err: any) {
      console.error("Error verifying password reset OTP:", err);
      await checkRateLimit(email, "password_reset", "record_failure");
      return { error: new Error(err.message || "Failed to verify OTP") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    // Check rate limit first
    const rateCheck = await checkRateLimit(email, "password_reset", "check");
    if (!rateCheck.allowed) {
      return { error: new Error(rateCheck.message || "Too many reset attempts. Please try again later.") };
    }

    const redirectUrl = `${getAppOrigin()}/auth?mode=reset`;
    
    try {
      // Use custom edge function for branded email
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, redirectUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        await checkRateLimit(email, "password_reset", "record_failure");
        return { error: new Error(errorData.error || "Failed to send reset email") };
      }

      return { error: null };
    } catch (err: any) {
      await checkRateLimit(email, "password_reset", "record_failure");
      return { error: new Error(err.message || "Failed to send reset email") };
    }
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signInWithEmailOtp,
        sendPasswordResetOtp,
        verifyEmailOtp,
        verifyPasswordResetOtp,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
