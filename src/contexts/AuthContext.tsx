import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Always use current origin - works on localhost, Lovable preview, or production domain
const getAppOrigin = () => window.location.origin;

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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
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
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      await checkRateLimit(email, "login", "record_failure");
    } else {
      await checkRateLimit(email, "login", "reset");
    }

    return { error };
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
