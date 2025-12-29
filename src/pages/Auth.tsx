import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, KeyRound, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordStrengthIndicator from "@/components/PasswordStrengthIndicator";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255, "Email too long");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character (!@#$%^&*)");
const otpSchema = z.string().length(8, "OTP must be 8 digits").regex(/^\d+$/, "OTP must contain only numbers");
const phoneSchema = z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long").regex(/^[+]?[\d\s-]+$/, "Invalid phone number format");

type AuthMode = "login" | "signup" | "signup-verify" | "forgot" | "forgot-verify" | "reset" | "email-otp" | "email-otp-verify";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    otpEmail: "",
    otp: "",
    forgotOtp: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const startResendCountdown = useCallback(() => {
    setResendCountdown(60); // 60 seconds countdown
  }, []);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithEmailOtp, sendPasswordResetOtp, verifyEmailOtp, resetPassword, updatePassword, isLoading } = useAuth();

  // Check URL for password reset mode
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (urlMode === "reset") {
      setMode("reset");
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && !isLoading && mode !== "reset") {
      navigate("/");
    }
  }, [user, isLoading, navigate, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignupForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > 50) {
      newErrors.firstName = "First name too long";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > 50) {
      newErrors.lastName = "Last name too long";
    }
    
    // Phone validation - required
    const phoneResult = phoneSchema.safeParse(formData.phone);
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneResult.success) {
      newErrors.phone = phoneResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(formData.email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = () => {
    const newErrors: Record<string, string> = {};

    const passwordResult = passwordSchema.safeParse(formData.password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmailOtpForm = () => {
    const newErrors: Record<string, string> = {};

    const emailResult = emailSchema.safeParse(formData.otpEmail);
    if (!emailResult.success) {
      newErrors.otpEmail = emailResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtpForm = () => {
    const newErrors: Record<string, string> = {};

    const otpResult = otpSchema.safeParse(formData.otp);
    if (!otpResult.success) {
      newErrors.otp = otpResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotOtpForm = () => {
    const newErrors: Record<string, string> = {};

    const otpResult = otpSchema.safeParse(formData.forgotOtp);
    if (!otpResult.success) {
      newErrors.forgotOtp = otpResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login Failed",
            description: "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignupForm()) return;

    setIsSubmitting(true);
    try {
      // Check if email or phone already exists
      const { data: existsData, error: existsError } = await supabase
        .rpc('check_account_exists', { 
          check_email: formData.email, 
          check_phone: formData.phone 
        });

      if (existsError) {
        toast({
          title: "Error",
          description: "Unable to verify account details. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (existsData && existsData.length > 0) {
        const { email_exists, phone_exists } = existsData[0];
        
        if (email_exists) {
          setErrors(prev => ({ ...prev, email: "An account with this email already exists" }));
          toast({
            title: "Email Already Registered",
            description: "This email is already associated with an account. Please sign in instead.",
            variant: "destructive",
          });
          return;
        }

        if (phone_exists) {
          setErrors(prev => ({ ...prev, phone: "This phone number is already registered" }));
          toast({
            title: "Phone Number Already Registered",
            description: "This phone number is already associated with an account.",
            variant: "destructive",
          });
          return;
        }
      }

      // Send OTP to verify email first
      const { error } = await signInWithEmailOtp(formData.email);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Verification Code Sent!",
        description: "Please check your email for the 8-digit code.",
      });
      // Store the OTP in state and move to verify mode
      setFormData(prev => ({ ...prev, otp: "" }));
      startResendCountdown();
      setMode("signup-verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtpForm()) return;

    setIsSubmitting(true);
    try {
      // Verify OTP first
      const { error: otpError } = await verifyEmailOtp(formData.email, formData.otp);
      if (otpError) {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // OTP verified - now update the user's profile with additional data
      // The user is now logged in via OTP, update their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Update auth user metadata
        await supabase.auth.updateUser({
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
          }
        });

        // Update or create profile
        await supabase.from('profiles').upsert({
          user_id: user.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
        }, { onConflict: 'user_id' });
      }

      toast({
        title: "Account Created!",
        description: "Your email has been verified. Welcome to RAYN ADAM!",
      });
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendSignupOtp = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmailOtp(formData.email);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent to your email.",
      });
      startResendCountdown();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForgotForm()) return;

    setIsSubmitting(true);
    try {
      // Send OTP for password reset using 6-digit OTP
      const { error } = await sendPasswordResetOtp(formData.email);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "OTP Sent!",
        description: "Check your email for the 8-digit verification code.",
      });
      setFormData(prev => ({ ...prev, forgotOtp: "" }));
      startResendCountdown();
      setMode("forgot-verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForgotOtpForm()) return;

    setIsSubmitting(true);
    try {
      // Verify OTP - this logs the user in
      const { error } = await verifyEmailOtp(formData.email, formData.forgotOtp);
      if (error) {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Verified!",
        description: "Now set your new password.",
      });
      setMode("reset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendForgotOtp = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await sendPasswordResetOtp(formData.email);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent to your email.",
      });
      startResendCountdown();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(formData.password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Password Updated!",
        description: "Your password has been successfully reset.",
      });
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmailOtpForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmailOtp(formData.otpEmail);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "OTP Sent!",
        description: "Check your email for the 8-digit verification code.",
      });
      startResendCountdown();
      setMode("email-otp-verify");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtpForm()) return;

    setIsSubmitting(true);
    try {
      const { error } = await verifyEmailOtp(formData.otpEmail, formData.otp);
      if (error) {
        toast({
          title: "Verification Failed",
          description: "Invalid or expired code. Please try again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Welcome!",
        description: "You have successfully logged in.",
      });
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendEmailOtp = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithEmailOtp(formData.otpEmail);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent to your email.",
      });
      startResendCountdown();
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case "signup": return "Create Account";
      case "signup-verify": return "Verify Email";
      case "forgot": return "Forgot Password";
      case "forgot-verify": return "Verify Email";
      case "reset": return "Reset Password";
      case "email-otp": return "Email OTP Login";
      case "email-otp-verify": return "Verify Email";
      default: return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signup": return "Join RAYN ADAM for exclusive offers";
      case "signup-verify": return `Enter the 8-digit code sent to ${formData.email}`;
      case "forgot": return "Enter your email to receive a verification code";
      case "forgot-verify": return `Enter the 8-digit code sent to ${formData.email}`;
      case "reset": return "Enter your new password";
      case "email-otp": return "Enter your email to receive a verification code";
      case "email-otp-verify": return `Enter the 8-digit code sent to ${formData.otpEmail}`;
      default: return "Sign in to access your account";
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
      </div>
      
      <Navbar />

      <main className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 md:mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <motion.div 
            className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-6 md:p-8 shadow-2xl shadow-primary/5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {/* Icon header for verification modes */}
            {(mode === "email-otp-verify" || mode === "signup-verify" || mode === "forgot-verify") && (
              <motion.div 
                className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Mail className="w-8 h-8 md:w-10 md:h-10 text-primary" />
              </motion.div>
            )}

            {/* Logo for non-verification modes */}
            {mode !== "email-otp-verify" && mode !== "signup-verify" && mode !== "forgot-verify" && (
              <div className="text-center mb-4">
                <span className="text-primary font-heading text-lg tracking-[0.3em]">RAYN ADAM</span>
              </div>
            )}
            
            <h1 className="text-xl md:text-2xl font-heading text-foreground mb-2 text-center">
              {getTitle()}
            </h1>
            <p className="text-muted-foreground text-center mb-6 text-sm md:text-base">
              {getSubtitle()}
            </p>

            {/* Login Form */}
            {mode === "login" && (
              <>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base"
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-11 pr-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 rounded-xl text-base"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-destructive text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card/80 px-3 text-muted-foreground tracking-wider">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-border/50 hover:border-primary/50 hover:bg-primary/5 rounded-xl font-medium transition-all"
                  onClick={() => setMode("email-otp")}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Email OTP
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setMode("signup")}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Signup Form */}
            {mode === "signup" && (
              <>
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                          placeholder="John"
                        />
                      </div>
                      {errors.firstName && (
                        <p className="text-destructive text-xs">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                          placeholder="Doe"
                        />
                      </div>
                      {errors.lastName && (
                        <p className="text-destructive text-xs">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signupEmail" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signupEmail"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-xs">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="signupPhone" className="text-sm font-medium">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signupPhone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="+91 9876543210"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-destructive text-xs">{errors.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-xl">
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>We'll send a verification code to your email</span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending code...
                      </span>
                    ) : (
                      <span>Continue</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Already have an account?{" "}
                    <button
                      onClick={() => setMode("login")}
                      className="text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </>
            )}

            {/* Signup OTP Verification Form */}
            {mode === "signup-verify" && (
              <>
                <form onSubmit={handleSignupVerify} className="space-y-5">
                  <div className="space-y-4">
                    <Label className="text-center block text-sm font-medium">Enter Verification Code</Label>
                    <div className="flex justify-center overflow-x-auto pb-2">
                      <div className="bg-background/50 border border-border/50 rounded-2xl p-4 md:p-6">
                        <InputOTP
                          maxLength={8}
                          value={formData.otp}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, otp: value }));
                            setErrors((prev) => ({ ...prev, otp: "" }));
                          }}
                        >
                          <InputOTPGroup className="gap-1.5 md:gap-2">
                            <InputOTPSlot index={0} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={1} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={2} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={3} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={4} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={5} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={6} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={7} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    {errors.otp && (
                      <p className="text-destructive text-xs text-center">{errors.otp}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting || formData.otp.length !== 8}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Creating account...
                      </span>
                    ) : (
                      <span>Verify & Create Account</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {resendCountdown > 0 ? (
                      <span>Resend code in <span className="text-primary font-medium">{resendCountdown}s</span></span>
                    ) : (
                      <>
                        Didn't receive the code?{" "}
                        <button
                          onClick={resendSignupOtp}
                          disabled={isSubmitting}
                          className="text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
                        >
                          Resend
                        </button>
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => setMode("signup")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    ← Change details
                  </button>
                </div>
              </>
            )}

            {/* Email OTP Login Form */}
            {mode === "email-otp" && (
              <>
                <form onSubmit={handleEmailOtpLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="otpEmail" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="otpEmail"
                        name="otpEmail"
                        type="email"
                        value={formData.otpEmail}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.otpEmail && (
                      <p className="text-destructive text-xs">{errors.otpEmail}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </span>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode("login")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    ← Back to password login
                  </button>
                </div>
              </>
            )}

            {/* Email OTP Verification Form */}
            {mode === "email-otp-verify" && (
              <>
                <form onSubmit={handleVerifyEmailOtp} className="space-y-5">
                  <div className="space-y-4">
                    <Label className="text-center block text-sm font-medium">Enter Verification Code</Label>
                    <div className="flex justify-center overflow-x-auto pb-2">
                      <div className="bg-background/50 border border-border/50 rounded-2xl p-4 md:p-6">
                        <InputOTP
                          maxLength={8}
                          value={formData.otp}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, otp: value }));
                            setErrors((prev) => ({ ...prev, otp: "" }));
                          }}
                        >
                          <InputOTPGroup className="gap-1.5 md:gap-2">
                            <InputOTPSlot index={0} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={1} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={2} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={3} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={4} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={5} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={6} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={7} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    {errors.otp && (
                      <p className="text-destructive text-xs text-center">{errors.otp}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting || formData.otp.length !== 8}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span>Verify & Sign In</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {resendCountdown > 0 ? (
                      <span>Resend code in <span className="text-primary font-medium">{resendCountdown}s</span></span>
                    ) : (
                      <>
                        Didn't receive the code?{" "}
                        <button
                          onClick={resendEmailOtp}
                          disabled={isSubmitting}
                          className="text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
                        >
                          Resend
                        </button>
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => setMode("email-otp")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    ← Change email
                  </button>
                </div>
              </>
            )}

            {/* Forgot Password Form */}
            {mode === "forgot" && (
              <>
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="forgotEmail" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="forgotEmail"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="you@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-destructive text-xs">{errors.email}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending OTP...
                      </span>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setMode("login")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    ← Back to login
                  </button>
                </div>
              </>
            )}

            {/* Forgot Password OTP Verification Form */}
            {mode === "forgot-verify" && (
              <>
                <form onSubmit={handleForgotVerify} className="space-y-5">
                  <div className="space-y-4">
                    <Label className="text-center block text-sm font-medium">Enter Verification Code</Label>
                    <div className="flex justify-center overflow-x-auto pb-2">
                      <div className="bg-background/50 border border-border/50 rounded-2xl p-4 md:p-6">
                        <InputOTP
                          maxLength={8}
                          value={formData.forgotOtp}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, forgotOtp: value }));
                            setErrors((prev) => ({ ...prev, forgotOtp: "" }));
                          }}
                        >
                          <InputOTPGroup className="gap-1.5 md:gap-2">
                            <InputOTPSlot index={0} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={1} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={2} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={3} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={4} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={5} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={6} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                            <InputOTPSlot index={7} className="w-9 h-11 md:w-10 md:h-12 text-lg font-bold border-border/50 bg-background rounded-lg" />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                    </div>
                    {errors.forgotOtp && (
                      <p className="text-destructive text-xs text-center">{errors.forgotOtp}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting || formData.forgotOtp.length !== 8}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center space-y-3">
                  <p className="text-muted-foreground text-sm">
                    {resendCountdown > 0 ? (
                      <span>Resend code in <span className="text-primary font-medium">{resendCountdown}s</span></span>
                    ) : (
                      <>
                        Didn't receive the code?{" "}
                        <button
                          onClick={resendForgotOtp}
                          disabled={isSubmitting}
                          className="text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
                        >
                          Resend
                        </button>
                      </>
                    )}
                  </p>
                  <button
                    onClick={() => setMode("forgot")}
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    ← Change email
                  </button>
                </div>
              </>
            )}

            {/* Reset Password Form */}
            {mode === "reset" && (
              <>
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="pl-11 pr-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.password} />
                    {errors.password && (
                      <p className="text-destructive text-xs mt-2">{errors.password}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                        placeholder="••••••••"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-destructive text-xs">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
