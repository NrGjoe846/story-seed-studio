import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck, Check, LogIn, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const UserLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'email' | 'sent' | 'verified'>('email');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is already logged in, redirect to home
        navigate('/');
      }
    };
    checkSession();

    // Listen for auth state changes (magic link callback)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Save session info to localStorage and set verified flag
        localStorage.setItem('story_seed_user_email', session.user.email || '');
        localStorage.setItem('story_seed_user_id', session.user.id);
        localStorage.setItem('story_seed_verified', 'true');
        
        setEmailStep('verified');
        
        toast({
          title: 'Login Successful! ✓',
          description: 'Welcome back!',
        });

        // Redirect to home page after short delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  // Send Magic Link Email
  const handleSendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setSendingEmail(true);

    try {
      const redirectUrl = `${window.location.origin}/user`;
      
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
        description: 'Check your inbox and click the link to login.',
      });
      setEmailStep('sent');
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast({
        title: 'Failed to Send Email',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSendingEmail(false);
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
                Sign in with your email
              </p>
            </div>

            {/* Email Input Step */}
            {emailStep === 'email' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSendMagicLink}
                  disabled={sendingEmail || !email.includes('@')}
                  className="w-full"
                  variant="hero"
                  size="lg"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending Magic Link...
                    </>
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Magic Link Sent Step */}
            {emailStep === 'sent' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                  <Mail className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                  <h3 className="font-semibold text-blue-800 mb-2">Check Your Email</h3>
                  <p className="text-blue-600 text-sm mb-4">
                    We've sent a magic link to <strong>{email}</strong>
                  </p>
                  <p className="text-blue-600 text-xs">
                    Click the link in the email to login.
                  </p>
                </div>
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={() => {
                    const userAgent = navigator.userAgent.toLowerCase();
                    const isAndroid = /android/i.test(userAgent);
                    const isIOS = /iphone|ipad|ipod/i.test(userAgent);
                    
                    if (isAndroid) {
                      window.location.href = 'googlegmail://';
                    } else if (isIOS) {
                      window.location.href = 'message://';
                    } else {
                      window.open('https://mail.google.com/mail/u/0/#inbox', '_blank');
                    }
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Open Email Inbox
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setEmailStep('email');
                    setEmail('');
                  }}
                >
                  Change Email Address
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSendMagicLink}
                  disabled={sendingEmail}
                >
                  {sendingEmail ? 'Sending...' : 'Resend Magic Link'}
                </Button>
              </div>
            )}

            {/* Verified Step */}
            {emailStep === 'verified' && (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-green-600">Login Successful!</h3>
                <p className="text-muted-foreground">Redirecting to home page...</p>
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
