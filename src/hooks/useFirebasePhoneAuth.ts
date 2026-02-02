import { useState, useCallback, useRef, useEffect } from 'react';
import { RecaptchaVerifier } from 'firebase/auth';
import { firebaseAuth, initRecaptcha, sendPhoneOtp, verifyPhoneOtp, signOutFirebase } from '@/lib/firebase';
import { supabase } from '@/integrations/supabase/client';

interface UseFirebasePhoneAuthReturn {
  isLoading: boolean;
  error: string | null;
  otpSent: boolean;
  sendOtp: (phoneNumber: string, buttonId: string) => Promise<boolean>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; isNewUser?: boolean }>;
  resetState: () => void;
}

/**
 * Custom hook for Firebase Phone Authentication
 * Integrates with Supabase for user management while using Firebase for phone verification
 */
export const useFirebasePhoneAuth = (): UseFirebasePhoneAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhoneNumber, setCurrentPhoneNumber] = useState<string>('');
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Cleanup recaptcha on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string, buttonId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Clear existing recaptcha if any
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      // Initialize new recaptcha
      recaptchaVerifierRef.current = initRecaptcha(buttonId);

      const result = await sendPhoneOtp(phoneNumber, recaptchaVerifierRef.current);
      
      if (result.success) {
        setOtpSent(true);
        setCurrentPhoneNumber(phoneNumber);
        return true;
      } else {
        setError(result.error || 'Failed to send OTP');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<{ success: boolean; isNewUser?: boolean }> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await verifyPhoneOtp(otp);
      
      if (!result.success) {
        setError(result.error || 'Verification failed');
        return { success: false };
      }

      // Phone verified via Firebase, now check if user exists in Supabase by phone
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('phone', currentPhoneNumber)
        .limit(1);

      const isNewUser = !existingProfiles || existingProfiles.length === 0;

      // Sign out from Firebase (we only used it for phone verification)
      await signOutFirebase();

      if (!isNewUser && existingProfiles?.[0]?.user_id) {
        // Existing user - create a magic link for them
        // Note: This creates an anonymous session marker; the user still needs to complete Supabase auth
        // Store the verified phone number for the auth flow
        localStorage.setItem('verified_phone_number', currentPhoneNumber);
        localStorage.setItem('verified_phone_timestamp', Date.now().toString());
      } else {
        // New user - store phone for signup flow
        localStorage.setItem('verified_phone_number', currentPhoneNumber);
        localStorage.setItem('verified_phone_timestamp', Date.now().toString());
      }

      return { success: true, isNewUser };
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [currentPhoneNumber]);

  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setOtpSent(false);
    setCurrentPhoneNumber('');
    
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
      recaptchaVerifierRef.current = null;
    }
  }, []);

  return {
    isLoading,
    error,
    otpSent,
    sendOtp,
    verifyOtp,
    resetState
  };
};

/**
 * Check if a verified phone number exists and is still valid (within 5 minutes)
 */
export const getVerifiedPhoneNumber = (): string | null => {
  const phone = localStorage.getItem('verified_phone_number');
  const timestamp = localStorage.getItem('verified_phone_timestamp');
  
  if (!phone || !timestamp) return null;
  
  const elapsed = Date.now() - parseInt(timestamp, 10);
  const fiveMinutes = 5 * 60 * 1000;
  
  if (elapsed > fiveMinutes) {
    // Expired - clear storage
    localStorage.removeItem('verified_phone_number');
    localStorage.removeItem('verified_phone_timestamp');
    return null;
  }
  
  return phone;
};

/**
 * Clear the verified phone number from storage
 */
export const clearVerifiedPhoneNumber = (): void => {
  localStorage.removeItem('verified_phone_number');
  localStorage.removeItem('verified_phone_timestamp');
};
