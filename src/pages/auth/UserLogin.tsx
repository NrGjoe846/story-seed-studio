import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, Check, LogIn, ExternalLink } from 'lucide-react';
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
      // Check localStorage first
      const storedVerified = localStorage.getItem('story_seed_verified') === 'true';
      const storedEmail = localStorage.getItem('story_seed_user_email');
      
      if (storedVerified && storedEmail) {
        navigate('/');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        // User is already logged in, set verified and redirect to home
        localStorage.setItem('story_seed_verified', 'true');
        localStorage.setItem('story_seed_user_email', session.user.email);
        localStorage.setItem('story_seed_user_id', session.user.id);
        navigate('/');
      }
    };
    checkSession();
  }, [navigate]);

  // Listen for auth state changes (when user clicks magic link)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        // User verified via magic link
        localStorage.setItem('story_seed_verified', 'true');
        localStorage.setItem('story_seed_user_email', session.user.email);
        localStorage.setItem('story_seed_user_id', session.user.id);
        
        // Try to get user name from registrations
        const { data: registration } = await supabase
          .from('registrations')
          .select('first_name')
          .eq('email', session.user.email)
          .limit(1)
          .maybeSingle();
        
        if (registration?.first_name) {
          localStorage.setItem('story_seed_user_name', registration.first_name);
        }
        
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

  // Send magic link email
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
      // Use current origin for redirect, ensuring it goes to home page
      const redirectUrl = `${window.location.origin}/`;
      
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
        title: 'Magic Link Sent!',
        description: 'Please check your email inbox for the verification link.',
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

  // Open email inbox based on device
  const openEmailInbox = () => {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    // Check if mobile/tablet
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, try to open the native email app inbox
      if (emailDomain?.includes('gmail')) {
        // Gmail app deep link to inbox
        window.location.href = 'googlegmail://';
      } else if (emailDomain?.includes('outlook') || emailDomain?.includes('hotmail') || emailDomain?.includes('live')) {
        // Outlook app
        window.location.href = 'ms-outlook://';
      } else if (emailDomain?.includes('yahoo')) {
        // Yahoo mail app
        window.location.href = 'ymail://';
      } else {
        // Generic email intent for Android or mailto for iOS
        window.location.href = 'mailto:';
      }
    } else {
      // Desktop - open web inbox
      if (emailDomain?.includes('gmail')) {
        window.open('https://mail.google.com/mail/u/0/#inbox', '_blank');
      } else if (emailDomain?.includes('outlook') || emailDomain?.includes('hotmail') || emailDomain?.includes('live')) {
        window.open('https://outlook.live.com/mail/0/inbox', '_blank');
      } else if (emailDomain?.includes('yahoo')) {
        window.open('https://mail.yahoo.com/d/folders/1', '_blank');
      } else {
        // Generic - just show a message
        toast({
          title: 'Check Your Email',
          description: 'Please open your email inbox to find the magic link.',
        });
      }
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
                Sign in with your email address
              </p>
            </div>

            {/* Email Input Step */}
            {emailStep === 'email' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
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
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Check Your Email</h3>
                  <p className="text-muted-foreground">
                    We've sent a magic link to<br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the link in the email to sign in. The link will redirect you to the home page.
                  </p>
                </div>
                <Button
                  onClick={openEmailInbox}
                  className="w-full"
                  variant="hero"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Email Inbox
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setEmailStep('email');
                  }}
                >
                  Change Email Address
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
