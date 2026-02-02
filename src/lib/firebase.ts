import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";

// Firebase configuration - these are public keys safe to store in code
const firebaseConfig = {
  apiKey: "AIzaSyBhknyGiZjrVFLL8Dq8b5k9upIeV4QvUYs",
  authDomain: "raynadamperfumes.firebaseapp.com",
  projectId: "raynadamperfumes",
  storageBucket: "raynadamperfumes.firebasestorage.app",
  messagingSenderId: "995326292656",
  appId: "1:995326292656:web:d755979159331b3918c175",
  measurementId: "G-JW7BMQ4TZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

// Store confirmation result for OTP verification
let confirmationResult: ConfirmationResult | null = null;

/**
 * Initialize invisible reCAPTCHA verifier
 */
export const initRecaptcha = (buttonId: string): RecaptchaVerifier => {
  const verifier = new RecaptchaVerifier(firebaseAuth, buttonId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - will proceed with submit
    },
    'expired-callback': () => {
      // Response expired, user will need to re-verify
    }
  });
  return verifier;
};

/**
 * Send OTP to phone number using Firebase Phone Auth
 * @param phoneNumber - Full phone number with country code (e.g., +919876543210)
 * @param recaptchaVerifier - RecaptchaVerifier instance
 */
export const sendPhoneOtp = async (
  phoneNumber: string, 
  recaptchaVerifier: RecaptchaVerifier
): Promise<{ success: boolean; error?: string }> => {
  try {
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, phoneNumber, recaptchaVerifier);
    return { success: true };
  } catch (error: any) {
    console.error("Firebase Phone Auth Error:", error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/invalid-phone-number') {
      return { success: false, error: 'Invalid phone number format' };
    }
    if (error.code === 'auth/too-many-requests') {
      return { success: false, error: 'Too many requests. Please try again later.' };
    }
    if (error.code === 'auth/quota-exceeded') {
      return { success: false, error: 'SMS quota exceeded. Please try again later.' };
    }
    
    return { success: false, error: error.message || 'Failed to send OTP' };
  }
};

/**
 * Verify the OTP code entered by user
 * @param otp - 6-digit OTP code
 */
export const verifyPhoneOtp = async (otp: string): Promise<{ success: boolean; error?: string }> => {
  if (!confirmationResult) {
    return { success: false, error: 'No OTP was sent. Please request a new code.' };
  }
  
  try {
    await confirmationResult.confirm(otp);
    confirmationResult = null; // Clear after successful verification
    return { success: true };
  } catch (error: any) {
    console.error("Firebase OTP Verification Error:", error);
    
    if (error.code === 'auth/invalid-verification-code') {
      return { success: false, error: 'Invalid verification code' };
    }
    if (error.code === 'auth/code-expired') {
      return { success: false, error: 'Code has expired. Please request a new one.' };
    }
    
    return { success: false, error: error.message || 'Failed to verify OTP' };
  }
};

/**
 * Sign out from Firebase
 */
export const signOutFirebase = async (): Promise<void> => {
  try {
    await firebaseAuth.signOut();
  } catch (error) {
    console.error("Firebase signout error:", error);
  }
};

export default app;
