import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

// No longer need to generate user ID from phone - use Supabase auth user ID

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing Supabase auth session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.phone) {
        // User already logged in, redirect to dashboard
        const phoneDigits = session.user.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
        localStorage.setItem('story_seed_user_phone', phoneDigits);
        localStorage.setItem('story_seed_user_id', session.user.id);
        navigate('/dashboard');
      }
      setCheckingSession(false);
    };
    checkExistingSession();
  }, [navigate]);

  const handleSendOTP = async () => {
    const phoneDigits = phone.replace(/\D/g, '').slice(-10);
    
    if (phoneDigits.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has registrations with this phone number
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, first_name, phone')
      .limit(100);

    if (regError) {
      toast({
        title: 'Error',
        description: 'Could not verify phone number. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    const userRegistration = registrations?.find(r => {
      const regPhoneDigits = r.phone.replace(/\D/g, '').slice(-10);
      return regPhoneDigits === phoneDigits;
    });

    if (!userRegistration) {
      toast({
        title: 'Phone Not Found',
        description: 'No registration found with this phone number. Please register for an event first.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

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
      setStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Failed to Send OTP',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const phoneDigits = phone.replace(/\D/g, '').slice(-10);
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
        setVerified(true);
        
        // Fetch user name from registrations
        const { data: registrations } = await supabase
          .from('registrations')
          .select('first_name, phone')
          .limit(100);

        const userRegistration = registrations?.find(r => {
          const regPhoneDigits = r.phone.replace(/\D/g, '').slice(-10);
          return regPhoneDigits === phoneDigits;
        });

        // Store phone, name and user_id in localStorage
        localStorage.setItem('story_seed_user_phone', phoneDigits);
        localStorage.setItem('story_seed_user_id', data.user.id);
        if (userRegistration) {
          localStorage.setItem('story_seed_user_name', userRegistration.first_name);
        }

        toast({
          title: 'Login Successful! 🎉',
          description: 'Welcome back to Story Seed Studio!',
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
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
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtp('');
    await handleSendOTP();
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-6">
            <div className="relative w-16 h-16 rounded-xl bg-primary shadow-lg flex items-center justify-center overflow-hidden">
              <img src={logo} alt="Story Seed Studio" className="w-12 h-12 object-contain scale-125" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Login to your Story Seed Studio dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/20 rounded-3xl p-8 shadow-2xl">
          {verified ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Verified!</h2>
              <p className="text-muted-foreground">Redirecting to your dashboard...</p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-primary" />
            </div>
          ) : step === 'phone' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground font-medium">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your 10-digit phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    maxLength={10}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the phone number you used during registration
                </p>
              </div>

              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.replace(/\D/g, '').length !== 10}
                className="w-full h-12 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Don't have an account?
                </p>
                <Link to="/register">
                  <Button variant="outline" className="w-full">
                    Register for an Event
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                onClick={() => setStep('phone')}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Change phone number
              </button>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Enter Verification Code
                </h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to +91 {phone}
                </p>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
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

              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full h-12 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify & Login
                    <CheckCircle className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Didn't receive the code? Resend OTP
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
