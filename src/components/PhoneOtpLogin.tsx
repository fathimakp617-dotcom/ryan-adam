import { useState, useEffect, useCallback, useId } from 'react';
import { Phone, Clock, ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import CountryCodeSelect from '@/components/CountryCodeSelect';
import { useFirebasePhoneAuth } from '@/hooks/useFirebasePhoneAuth';
import { useToast } from '@/hooks/use-toast';
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
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiryTime, setOtpExpiryTime] = useState(0);
  
  const uniqueId = useId();
  const buttonId = `phone-otp-btn-${uniqueId.replace(/:/g, '')}`;
  
  const { isLoading, error: authError, sendOtp, verifyOtp, resetState } = useFirebasePhoneAuth();
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

  // Get full phone number with country code
  const getFullPhoneNumber = useCallback(() => {
    const code = countryCode.split('-')[0];
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

    const fullPhone = getFullPhoneNumber();
    const success = await sendOtp(fullPhone, buttonId);

    if (success) {
      toast({
        title: "OTP Sent!",
        description: `Verification code sent to ${fullPhone}`,
      });
      setMode('verify-otp');
      setResendCountdown(60);
      setOtpExpiryTime(5 * 60); // 5 minutes for SMS OTP
    } else if (authError) {
      setError(authError);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    const result = await verifyOtp(otp);

    if (result.success) {
      toast({
        title: "Phone Verified!",
        description: result.isNewUser 
          ? "Please complete your registration" 
          : "Welcome back!",
      });
      onSuccess(result.isNewUser ?? true);
    } else if (authError) {
      setError(authError);
    }
  };

  const handleResendOtp = async () => {
    const fullPhone = getFullPhoneNumber();
    resetState();
    setOtp('');
    
    const success = await sendOtp(fullPhone, buttonId);
    
    if (success) {
      toast({
        title: "OTP Sent!",
        description: "A new verification code has been sent to your phone.",
      });
      setResendCountdown(60);
      setOtpExpiryTime(5 * 60);
    }
  };

  const handleBack = () => {
    if (mode === 'verify-otp') {
      setMode('enter-phone');
      setOtp('');
      resetState();
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-5">
      {/* Phone icon header */}
      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
        <Smartphone className="w-8 h-8 md:w-10 md:h-10 text-primary" />
      </div>

      <h2 className="text-xl md:text-2xl font-heading text-foreground text-center">
        {mode === 'enter-phone' ? 'Phone OTP Login' : 'Verify Phone'}
      </h2>
      <p className="text-muted-foreground text-center text-sm md:text-base">
        {mode === 'enter-phone' 
          ? 'Enter your phone number to receive an OTP' 
          : `Enter the 6-digit code sent to ${getFullPhoneNumber()}`}
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

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-xl">
            <Smartphone className="w-4 h-4 text-primary flex-shrink-0" />
            <span>You'll receive a 6-digit SMS code for verification</span>
          </div>

          <Button
            id={buttonId}
            type="submit"
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Sending OTP...
              </span>
            ) : (
              <span>Send OTP</span>
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
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setError('');
                  }}
                >
                  <InputOTPGroup className="gap-2 md:gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className="w-10 h-12 md:w-12 md:h-14 text-xl md:text-2xl font-bold border-border/50 bg-background rounded-lg" 
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
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium text-base shadow-lg shadow-primary/20"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Verifying...
              </span>
            ) : (
              <span>Verify & Continue</span>
            )}
          </Button>

          <div className="text-center space-y-3">
            <p className="text-muted-foreground text-sm">
              {resendCountdown > 0 ? (
                <span>Resend code in <span className="text-primary font-medium">{resendCountdown}s</span></span>
              ) : (
                <>
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-primary hover:text-primary/80 font-medium disabled:opacity-50 transition-colors"
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
