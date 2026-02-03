import { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import CountryCodeSelect from '@/components/CountryCodeSelect';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const phoneSchema = z.string()
  .min(6, "Phone number must be at least 6 digits")
  .max(15, "Phone number too long")
  .regex(/^[\d]+$/, "Phone number must contain only digits");

interface PhoneOtpLoginProps {
  onSuccess: (isNewUser: boolean) => void;
  onBack: () => void;
}

type PhoneOtpMode = 'enter-phone' | 'verify-otp';

export const PhoneOtpLogin = ({ onSuccess, onBack }: PhoneOtpLoginProps) => {
  const [mode, setMode] = useState<PhoneOtpMode>('enter-phone');
  const [countryCode, setCountryCode] = useState('+91-IN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiryTime, setOtpExpiryTime] = useState(0);
  
  const { toast } = useToast();

  // Countdown timers
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    if (otpExpiryTime > 0) {
      const timer = setTimeout(() => setOtpExpiryTime(otpExpiryTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpExpiryTime]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get full phone number with country code (without + for storage)
  const getFullPhoneNumber = useCallback(() => {
    const code = countryCode.split('-')[0];
    return `${code}${phoneNumber}`;
  }, [countryCode, phoneNumber]);

  // Get display phone number with +
  const getDisplayPhoneNumber = useCallback(() => {
    const code = countryCode.split('-')[0];
    return `${code} ${phoneNumber}`;
  }, [countryCode, phoneNumber]);

  // Format phone for API (E.164 without +)
  const getApiPhoneNumber = useCallback(() => {
    const code = countryCode.split('-')[0].replace('+', '');
    return `${code}${phoneNumber}`;
  }, [countryCode, phoneNumber]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate phone number
    const result = phoneSchema.safeParse(phoneNumber);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = getFullPhoneNumber();
      
      const { data, error: fnError } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { 
          phone: fullPhone,
          otp_type: 'login'
        }
      });

      if (fnError) {
        console.error('WhatsApp OTP error:', fnError);
        setError('Failed to send OTP. Please try again.');
        return;
      }

      if (data?.error) {
        setError(data.details || data.error);
        return;
      }

      toast({
        title: "OTP Sent via WhatsApp!",
        description: `Check WhatsApp on ${getDisplayPhoneNumber()}`,
      });
      setMode('verify-otp');
      setResendCountdown(60);
      setOtpExpiryTime(10 * 60); // 10 minutes for WhatsApp OTP
    } catch (err: any) {
      console.error('Send OTP error:', err);
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 4) {
      setError('Please enter the 4-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const apiPhone = getApiPhoneNumber();
      
      const { data, error: fnError } = await supabase.functions.invoke('verify-custom-otp', {
        body: { 
          email: apiPhone, // Phone number stored in email field
          otp: otp,
          otp_type: 'login'
        }
      });

      if (fnError) {
        console.error('Verify OTP error:', fnError);
        setError('Verification failed. Please try again.');
        return;
      }

      if (!data?.valid) {
        setError(data?.error || 'Invalid or expired code');
        return;
      }

      // Check if this is a new user (no account with this phone)
      if (data.isNewUser) {
        toast({
          title: "Phone Verified!",
          description: "Please complete your registration.",
        });
        onSuccess(true); // true = new user
        return;
      }

      // If we got an action_link, follow it to create session
      if (data.action_link) {
        toast({
          title: "Phone Verified!",
          description: "Completing login...",
        });
        
        // Follow the magic link to complete auth
        window.location.href = data.action_link;
        return;
      }

      toast({
        title: "Phone Verified!",
        description: "Welcome!",
      });
      onSuccess(false);
    } catch (err: any) {
      console.error('Verify error:', err);
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp('');
    setError('');
    
    setIsLoading(true);
    try {
      const fullPhone = getFullPhoneNumber();
      
      const { data, error: fnError } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { 
          phone: fullPhone,
          otp_type: 'login'
        }
      });

      if (fnError || data?.error) {
        setError('Failed to resend OTP');
        return;
      }

      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent via WhatsApp.",
      });
      setResendCountdown(60);
      setOtpExpiryTime(10 * 60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (mode === 'verify-otp') {
      setMode('enter-phone');
      setOtp('');
      setError('');
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-5">
      {/* WhatsApp icon header */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500/20 to-green-500/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
        <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
      </div>

      <h2 className="text-xl md:text-2xl font-heading text-foreground text-center">
        {mode === 'enter-phone' ? 'WhatsApp OTP Login' : 'Verify Phone'}
      </h2>
      <p className="text-muted-foreground text-center text-sm md:text-base">
        {mode === 'enter-phone' 
          ? 'Enter your phone number to receive an OTP via WhatsApp' 
          : `Enter the 4-digit code sent to ${getDisplayPhoneNumber()}`}
      </p>

      {mode === 'enter-phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <div className="flex gap-2">
              <CountryCodeSelect
                value={countryCode}
                onChange={setCountryCode}
              />
              <div className="relative flex-1">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  className="pl-11 h-12 bg-background/50 border-border/50 focus:border-primary/50 rounded-xl text-base"
                  placeholder="9876543210"
                  maxLength={15}
                />
              </div>
            </div>
            {error && (
              <p className="text-destructive text-xs mt-1">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-500/5 border border-green-500/10 p-3 rounded-xl">
            <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>You'll receive a 4-digit code on WhatsApp for verification</span>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-green-600 text-white hover:bg-green-700 rounded-xl font-medium text-base shadow-lg shadow-green-600/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Send WhatsApp OTP
              </span>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <div className="space-y-4">
            <Label className="text-center block text-sm font-medium">Enter Verification Code</Label>
            <div className="flex justify-center overflow-x-auto pb-2">
              <div className="bg-background/50 border border-border/50 rounded-2xl p-4 md:p-6">
                <InputOTP
                  maxLength={4}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setError('');
                  }}
                >
                  <InputOTPGroup className="gap-2 md:gap-3">
                    {[0, 1, 2, 3].map((index) => (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className="w-12 h-14 md:w-14 md:h-16 text-2xl md:text-3xl font-bold border-border/50 bg-background rounded-lg" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            {error && (
              <p className="text-destructive text-xs text-center">{error}</p>
            )}

            {/* OTP Expiry Timer */}
            {otpExpiryTime > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <Clock className={`w-4 h-4 ${otpExpiryTime <= 60 ? 'text-destructive' : 'text-muted-foreground'}`} />
                <span className={otpExpiryTime <= 60 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  Code expires in {formatTime(otpExpiryTime)}
                </span>
              </div>
            )}
            {otpExpiryTime === 0 && (
              <p className="text-destructive text-xs text-center">Code expired. Please request a new one.</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-green-600 text-white hover:bg-green-700 rounded-xl font-medium text-base shadow-lg shadow-green-600/20"
            disabled={isLoading || otp.length !== 4}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span>Verify & Continue</span>
            )}
          </Button>

          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              {resendCountdown > 0 ? (
                <span>Resend code in <span className="text-green-600 font-medium">{resendCountdown}s</span></span>
              ) : (
                <>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    Resend
                  </button>
                </>
              )}
            </p>
          </div>
        </form>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" />
          {mode === 'verify-otp' ? 'Change number' : 'Back to login options'}
        </button>
      </div>
    </div>
  );
};

export default PhoneOtpLogin;