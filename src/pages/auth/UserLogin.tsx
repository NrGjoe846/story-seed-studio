import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, ShieldCheck, Check, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already logged in, redirect to dashboard
        navigate('/user/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  // Handle phone input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    const phoneDigits = digits.startsWith('91') ? digits.slice(2) : digits;
    if (phoneDigits.length <= 10) {
      setPhoneNumber(phoneDigits);
    }
  };

  // Send OTP using Supabase Phone Auth
  const handleSendOTP = async () => {
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive',
      });
      return;
    }

    setSendingOtp(true);

    try {
      const formattedPhone = `+91${phoneDigits}`;
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code.',
      });
      setOtpStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP using Supabase Phone Auth
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setVerifyingOtp(true);

    try {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+91${phoneDigits}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Save session info to localStorage
        localStorage.setItem('story_seed_user_phone', phoneDigits);
        localStorage.setItem('story_seed_user_id', data.user.id);
        
        // Try to get user name from registrations
        const { data: registration } = await supabase
          .from('registrations')
          .select('first_name')
          .eq('phone', phoneDigits)
          .limit(1)
          .maybeSingle();
        
        if (registration?.first_name) {
          localStorage.setItem('story_seed_user_name', registration.first_name);
        }
        
        setOtpStep('verified');
        
        toast({
          title: 'Login Successful! ✓',
          description: 'Welcome back!',
        });

        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/user/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid OTP. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-3xl p-6">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-gradient-hero rounded-2xl flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                User Login
              </h1>
              <p className="text-muted-foreground">
                Sign in with your phone number
              </p>
            </div>

            {/* Phone Input Step */}
            {otpStep === 'phone' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                      <span className="text-sm font-medium text-muted-foreground">IN+91</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="9342745299"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="pl-16"
                      maxLength={10}
                      required
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendOTP}
                  disabled={sendingOtp || phoneNumber.length !== 10}
                  className="w-full"
                  variant="hero"
                  size="lg"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send Verification Code
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* OTP Input Step */}
            {otpStep === 'otp' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-center block">Enter 6-digit OTP</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Sent to +91 {phoneNumber}
                  </p>
                </div>
                <Button
                  onClick={handleVerifyOTP}
                  disabled={verifyingOtp || otp.length !== 6}
                  className="w-full"
                  variant="hero"
                  size="lg"
                >
                  {verifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Verify & Login
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setOtpStep('phone');
                    setOtp('');
                  }}
                >
                  Change Phone Number
                </Button>
              </div>
            )}

            {/* Verified Step */}
            {otpStep === 'verified' && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-600">Login Successful!</h3>
                <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                <Loader2 className="w-6 h-6 mx-auto animate-spin text-primary" />
              </div>
            )}

            {/* Footer */}
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline font-medium">
                  Register Now
                </Link>
              </p>
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground block">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
