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

  const [isSigningIn, setIsSigningIn] = useState(false);
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

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/user`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'Could not sign in with Google.',
        variant: 'destructive',
      });
      setIsSigningIn(false);
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
          <div className="space-y-6">
            <p className="text-center text-muted-foreground mb-4">
              Please use your Google account to access your dashboard.
            </p>

            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full h-14 text-lg font-semibold bg-white text-black border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 group"
            >
              {isSigningIn ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="text-center pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                Need to register for an event?
              </p>
              <Link to="/register">
                <Button variant="outline" className="w-full py-6 rounded-2xl border-2 hover:bg-muted transition-all">
                  Browse Events & Register
                </Button>
              </Link>
            </div>
          </div>
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
