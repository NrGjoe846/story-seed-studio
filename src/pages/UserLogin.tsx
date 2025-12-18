import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'; // Changed Phone to Mail
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check for existing Supabase auth session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User already logged in, redirect to dashboard
        localStorage.setItem('story_seed_user_id', session.user.id);
        if (session.user.email) {
          localStorage.setItem('story_seed_user_email', session.user.email);
        }

        // Try to fetch name from registrations if not already in storage
        if (!localStorage.getItem('story_seed_user_name')) {
          const { data: registrations } = await supabase
            .from('registrations')
            .select('first_name')
            .eq('user_id', session.user.id)
            .limit(1);

          if (registrations && registrations.length > 0) {
            localStorage.setItem('story_seed_user_name', registrations[0].first_name);
          } else {
            // Try college registrations
            const { data: clgRegistrations } = await supabase
              .from('clg_registrations')
              .select('first_name')
              .eq('user_id', session.user.id)
              .limit(1);

            if (clgRegistrations && clgRegistrations.length > 0) {
              localStorage.setItem('story_seed_user_name', clgRegistrations[0].first_name);
            }
          }
        }

        // Also set verified flag to true to ensure dashboard access
        localStorage.setItem('story_seed_verified', 'true');

        navigate('/dashboard');
      }
      setCheckingSession(false);
    };
    checkExistingSession();
  }, [navigate]);

  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Check if user has registrations with this email (Optional, but good for UX to match previous logic)
      // Query both tables
      const { data: schoolReg, error: schoolError } = await supabase
        .from('registrations')
        .select('id, email')
        .eq('email', email.toLowerCase()) // assuming emails are stored lowercase
        .limit(1);

      const { data: clgReg, error: clgError } = await supabase
        .from('clg_registrations')
        .select('id, email')
        .eq('email', email.toLowerCase())
        .limit(1);

      // If no registration found in either table
      const hasRegistration = (schoolReg && schoolReg.length > 0) || (clgReg && clgReg.length > 0);

      if (!hasRegistration) {
        toast({
          title: 'Email Not Found',
          description: 'No registration found with this email. Please register for an event first.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const redirectUrl = `${window.location.origin}/user`; // Redirect back to this page to handle session check

      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Magic Link Sent',
        description: 'Please check your email for the login link.',
      });
      setStep('sent');
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast({
        title: 'Failed to Send Link',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
          {step === 'sent' ? (
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">
                We've sent a magic link to <strong>{email}</strong>.<br />
                Click the link to log in.
              </p>
              <Button
                variant="outline"
                onClick={() => setStep('email')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleSendMagicLink}
                disabled={loading || !email}
                className="w-full h-12 text-lg font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  <>
                    Send Login Link
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
