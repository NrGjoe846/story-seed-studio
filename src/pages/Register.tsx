import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, User, FileText, ArrowRight, ArrowLeft, Loader2, Calendar, Mail, ShieldCheck, CreditCard, Landmark, Scan, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileImage, FileType, GraduationCap, School, Video } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Event {
  id: string;
  name: string;
  description: string | null;
  is_payment_enabled: boolean;
  qr_code_url: string | null;
  event_type: 'school' | 'college' | 'both' | null;
}


const stepsWithPayment = [
  { id: 1, title: 'Verification', icon: ShieldCheck },
  { id: 2, title: 'Select Role', icon: School },
  { id: 3, title: 'Personal Info', icon: User },
  { id: 4, title: 'Story Details', icon: FileText },
  { id: 5, title: 'Payment', icon: CreditCard },
  { id: 6, title: 'Review & Submit', icon: Check },
];

const stepsFree = [
  { id: 1, title: 'Verification', icon: ShieldCheck },
  { id: 2, title: 'Select Role', icon: School },
  { id: 3, title: 'Personal Info', icon: User },
  { id: 4, title: 'Story Details', icon: FileText },
  { id: 5, title: 'Review & Submit', icon: Check },
];

const WEBHOOK_URL = 'https://kamalesh-tech-aiii.app.n8n.cloud/webhook/youtube-upload';
const CLG_WEBHOOK_URL = 'https://kamalesh-tech-aiii.app.n8n.cloud/webhook/clg_registration';

// Store user session based on Supabase auth user
const saveUserSession = (email: string, firstName: string, userId: string): void => {
  localStorage.setItem('story_seed_user_email', email);
  localStorage.setItem('story_seed_user_name', firstName);
  localStorage.setItem('story_seed_user_id', userId);
  let sessionId = localStorage.getItem('story_seed_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('story_seed_session_id', sessionId);
  }
};

const getSessionId = (): string => {
  let sessionId = localStorage.getItem('story_seed_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('story_seed_session_id', sessionId);
  }
  return sessionId;
};

const Register = () => {
  const [searchParams] = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdFromUrl || '');
  const [isEventLocked, setIsEventLocked] = useState(!!eventIdFromUrl);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'scan'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: '',
    senderName: '',
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Verification States




  // Role and Verification states
  const [role, setRole] = useState<'school' | 'college' | null>(() => {
    // Check local storage for existing role
    const savedRole = localStorage.getItem('story_seed_user_role');
    return (savedRole as 'school' | 'college') || null;
  });

  // Effect to persist role
  useEffect(() => {
    if (role) {
      localStorage.setItem('story_seed_user_role', role);
    }
  }, [role]);

  // Email verification states
  const [verificationEmail, setVerificationEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'email' | 'sent' | 'verified'>('email');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [lastMagicLinkRedirectUrl, setLastMagicLinkRedirectUrl] = useState('');
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    city: '',
    schoolName: '',
    collegeName: '',
    degree: '',
    branch: '',
  });
  const [storyDetails, setStoryDetails] = useState<{
    title: string;
    category: string;
    classLevel: string; // Used for "Year of Studying" as well
    description: string;
    videoFile: File | null;
    storyPdf: File | null;
    coverPage: File | null;
  }>({
    title: '',
    category: '',
    classLevel: '',
    description: '',
    videoFile: null,
    storyPdf: null,
    coverPage: null,
  });

  // Derived state
  const filteredEvents = events.filter(e => {
    if (!role) return true;
    if (!e.event_type) return true; // Forward compatibility if null
    if (e.event_type === 'both') return true;
    return e.event_type === role;
  });

  const selectedEvent = events.find(e => e.id === selectedEventId);
  // Default to false (no payment) if is_payment_enabled is null or undefined
  // This ensures existing events without payment settings don't show payment step
  const isPaymentEnabled = selectedEvent?.is_payment_enabled === true;
  const steps = isPaymentEnabled ? stepsWithPayment : stepsFree;


  // Fetch events
  useEffect(() => {
    const fetchData = async () => {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, description, is_payment_enabled, qr_code_url, event_type')
        .eq('is_active', true);

      if (!eventsError && eventsData) {
        setEvents(eventsData as unknown as Event[]);
      }
    };
    fetchData();
  }, []);

  // Lock event selection if eventId is in URL and auto-set role for single-type events
  useEffect(() => {
    if (eventIdFromUrl && events.length > 0) {
      setSelectedEventId(eventIdFromUrl);
      setIsEventLocked(true);
      
      // Auto-set role based on event type
      const event = events.find(e => e.id === eventIdFromUrl);
      if (event) {
        if (event.event_type === 'school') {
          setRole('school');
        } else if (event.event_type === 'college') {
          setRole('college');
        }
        // For 'both' type, user needs to select role manually
      }
    }
  }, [eventIdFromUrl, events]);

  // Validate selected event against role
  useEffect(() => {
    if (selectedEventId && events.length > 0 && role) {
      const event = events.find(e => e.id === selectedEventId);
      if (event) {
        const isCompatible = !event.event_type || event.event_type === 'both' || event.event_type === role;
        if (!isCompatible) {
          setSelectedEventId('');
          setIsEventLocked(false);
          toast({
            title: 'Event Unavailable',
            description: `The event "${event.name}" is not open to ${role} students. Please select another event.`,
            variant: "destructive"
          });
        }
      }
    }
  }, [role, selectedEventId, events]);

  // Check for existing session on mount and handle magic link callback
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email) {
        setAuthenticatedUserId(session.user.id);
        setVerificationEmail(session.user.email);
        setEmailStep('verified');
        setPersonalInfo(prev => ({ ...prev, email: session.user.email || '' }));
        localStorage.setItem('story_seed_user_email', session.user.email || '');
        localStorage.setItem('story_seed_user_id', session.user.id);
        
        // Determine which step to show based on role (will be updated when events load)
        const savedRole = localStorage.getItem('story_seed_user_role');
        if (savedRole) {
          setCurrentStep(3);
        } else {
          // Stay at step 1 until we know if we need role selection
          setCurrentStep(1);
        }
      } else {
        setVerificationEmail('');
        setEmailStep('email');
        setCurrentStep(1);
        setAuthenticatedUserId(null);
        localStorage.removeItem('story_seed_user_email');
        localStorage.removeItem('story_seed_user_name');
        localStorage.removeItem('story_seed_user_id');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session.user.email) {
        setAuthenticatedUserId(session.user.id);
        setVerificationEmail(session.user.email);
        setEmailStep('verified');
        setPersonalInfo(prev => ({ ...prev, email: session.user.email || '' }));
        localStorage.setItem('story_seed_user_email', session.user.email || '');
        localStorage.setItem('story_seed_user_id', session.user.id);
        
        // Don't auto-navigate here, let the user click Continue
        if (event === 'SIGNED_IN') {
          toast({ title: 'Email Verified! ✓', description: 'Click Continue to proceed.' });
        }
      } else if (event === 'SIGNED_OUT') {
        setVerificationEmail('');
        setEmailStep('email');
        setCurrentStep(1);
        setAuthenticatedUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send Magic Link Email
  const handleSendMagicLink = async () => {
    if (!verificationEmail || !verificationEmail.includes('@')) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    setSendingEmail(true);
    try {
      // Use selectedEventId (from URL or dropdown) for redirect
      const eventId = selectedEventId || eventIdFromUrl;
      const redirectUrl = `${window.location.origin}/register${eventId ? `?eventId=${eventId}` : ''}`;
      setLastMagicLinkRedirectUrl(redirectUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email: verificationEmail,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;

      toast({
        title: 'Magic Link Sent',
        description: `Check your inbox and click the link. Redirect: ${redirectUrl}`,
      });
      setEmailStep('sent');
    } catch (error: any) {
      console.error('Error sending magic link:', error);
      toast({ title: 'Failed to Send Email', description: error.message || 'Please try again later.', variant: 'destructive' });
    } finally {
      setSendingEmail(false);
    }
  };
  const validateStep1 = () => {
    if (emailStep !== 'verified') {
      toast({ title: 'Email Verification Required', description: 'Please verify your email to continue.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!role) {
      toast({ title: 'Role Required', description: 'Please select whether you are a School or College student.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    // Personal Info
    const { firstName, lastName, email, age, city, schoolName, collegeName } = personalInfo;
    if (!firstName || !lastName || !email || !age || !city) {
      toast({ title: 'Missing information', description: 'Please fill in all personal information fields.', variant: 'destructive' });
      return false;
    }
    if (role === 'school' && !schoolName) {
      toast({ title: 'Missing Information', description: 'Please enter your school name.', variant: 'destructive' });
      return false;
    }
    if (role === 'college') {
      if (!collegeName) {
        toast({ title: 'Missing Information', description: 'Please enter your college/institution name.', variant: 'destructive' });
        return false;
      }
      if (!personalInfo.degree || !personalInfo.branch) {
        toast({ title: 'Missing Details', description: 'Please enter your degree and branch.', variant: 'destructive' });
        return false;
      }
    }
    if (!selectedEventId) {
      toast({ title: 'Event Required', description: 'Please select an event to participate in.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    // Story Details
    const { title, category, classLevel, description, videoFile, storyPdf, coverPage } = storyDetails;
    if (!title || !category || !classLevel || !description) {
      toast({ title: 'Missing details', description: 'Please complete all story fields.', variant: 'destructive' });
      return false;
    }

    if (role === 'school' && !videoFile) {
      toast({ title: 'Video Required', description: 'Please upload your story video.', variant: 'destructive' });
      return false;
    }
    if (role === 'college') {
      if (!storyPdf) {
        toast({ title: 'PDF Required', description: 'Please upload your story PDF.', variant: 'destructive' });
        return false;
      }
    }
    return true;
  };

  const submitRegistration = async () => {
    if (!selectedEventId || !authenticatedUserId) {
      toast({ title: 'Error', description: 'Please verify your email first.', variant: 'destructive' });
      return false;
    }
    setIsSubmitting(true);
    try {
      const phoneDigits = personalInfo.phone.replace(/\D/g, '');
      const selectedEvent = events.find(e => e.id === selectedEventId);
      const isCollegeEvent = role === 'college';

      // Check for existing registration
      const tableName = isCollegeEvent ? 'clg_registrations' : 'registrations';
      const { data: existingByPhone } = await supabase
        .from(tableName)
        .select('id')
        .eq('event_id', selectedEventId)
        .ilike('phone', `%${phoneDigits.slice(-10)}`);

      if (existingByPhone && existingByPhone.length > 0) {
        toast({ title: 'Already Registered', description: 'You have already registered for this event.', variant: 'destructive' });
        setIsSubmitting(false);
        return false;
      }

      const sessionId = getSessionId();

      if (isCollegeEvent) {
        // Upload PDF to storage for college registrations
        let pdfUrl = null;
        if (storyDetails.storyPdf) {
          const fileName = `${authenticatedUserId}-${Date.now()}-${storyDetails.storyPdf.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('college-story-pdfs')
            .upload(fileName, storyDetails.storyPdf);

          if (uploadError) {
            console.error('PDF upload error:', uploadError);
            toast({ title: 'Upload Failed', description: 'Could not upload PDF. Please try again.', variant: 'destructive' });
            return false;
          }

          const { data: publicUrlData } = supabase.storage
            .from('college-story-pdfs')
            .getPublicUrl(fileName);
          pdfUrl = publicUrlData.publicUrl;
        }

        // Insert into clg_registrations table
        const { error: dbError } = await supabase.from('clg_registrations').insert({
          user_id: authenticatedUserId,
          event_id: selectedEventId,
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          email: personalInfo.email.toLowerCase(),
          phone: phoneDigits,
          age: parseInt(personalInfo.age),
          city: personalInfo.city,
          college_name: personalInfo.collegeName || null,
          degree: personalInfo.degree || null,
          branch: personalInfo.branch || null,
          story_title: storyDetails.title,
          category: storyDetails.category,
          story_description: storyDetails.description,
          pdf_url: pdfUrl,
        });

        if (dbError) {
          console.error('Database error:', dbError);
          toast({ title: 'Registration Failed', description: 'Could not save registration. Please try again.', variant: 'destructive' });
          return false;
        }
      } else {
        // Insert into registrations table for school events
        const { error: dbError } = await supabase.from('registrations').insert({
          user_id: authenticatedUserId,
          event_id: selectedEventId,
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          email: personalInfo.email.toLowerCase(),
          phone: phoneDigits,
          age: parseInt(personalInfo.age),
          city: personalInfo.city,
          story_title: storyDetails.title,
          category: storyDetails.category,
          class_level: storyDetails.classLevel,
          story_description: storyDetails.description,
        });

        if (dbError) {
          console.error('Database error:', dbError);
          toast({ title: 'Registration Failed', description: 'Could not save registration. Please try again.', variant: 'destructive' });
          return false;
        }
      }

      saveUserSession(personalInfo.email, personalInfo.firstName, authenticatedUserId);

      // Webhook - use different URLs for school vs college
      const webhookUrl = isCollegeEvent ? CLG_WEBHOOK_URL : WEBHOOK_URL;
      const formData = new FormData();
      formData.append('user_id', authenticatedUserId);
      formData.append('session_id', sessionId);
      formData.append('event_id', selectedEventId);
      formData.append('event_name', selectedEvent?.name || '');
      formData.append('role', role || '');
      formData.append('first_name', personalInfo.firstName);
      formData.append('last_name', personalInfo.lastName);
      formData.append('email', personalInfo.email);
      formData.append('phone', phoneDigits);
      formData.append('age', personalInfo.age);
      formData.append('city', personalInfo.city);
      
      if (role === 'school' && personalInfo.schoolName) {
        formData.append('school_name', personalInfo.schoolName);
      }
      if (role === 'college') {
        if (personalInfo.collegeName) formData.append('college_name', personalInfo.collegeName);
        if (personalInfo.degree) formData.append('degree', personalInfo.degree);
        if (personalInfo.branch) formData.append('branch', personalInfo.branch);
      }
      
      formData.append('year_of_studying', storyDetails.classLevel);
      formData.append('story_title', storyDetails.title);
      formData.append('category', storyDetails.category);
      formData.append('class_level', storyDetails.classLevel);
      formData.append('story_description', storyDetails.description);

      // Only append video for school events (not PDF for college events)
      if (!isCollegeEvent && storyDetails.videoFile) {
        formData.append('video', storyDetails.videoFile);
      }

      try {
        await fetch(webhookUrl, { method: 'POST', body: formData, mode: 'no-cors' });
        console.log('Webhook sent successfully to:', webhookUrl);
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
      }

      return true;
    } catch (error) {
      console.error('Submission error:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      
      // Check if role was already auto-set (for single-type events from URL)
      if (role) {
        setCurrentStep(3);
        return;
      }
      
      // Check event type for auto-skip
      const event = events.find(e => e.id === selectedEventId);
      if (event?.event_type === 'school') {
        setRole('school');
        setCurrentStep(3);
      } else if (event?.event_type === 'college') {
        setRole('college');
        setCurrentStep(3);
      } else {
        // For 'both' events or no event selected yet, show role selection
        setCurrentStep(2);
      }
      return;
    }

    if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!validateStep3()) return;
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      if (!validateStep4()) return;
      if (isPaymentEnabled) {
        setCurrentStep(5); // Go to Payment
      } else {
        setCurrentStep(5); // Go to Review for free (Step 5)
      }
      return;
    }

    if (currentStep === 5) {
      if (isPaymentEnabled) {
        // Validate Payment
        if (paymentMethod === 'upi' && !selectedUpiApp) {
          toast({ title: 'Select App', description: 'Please select a UPI app.', variant: 'destructive' });
          return;
        }
        if (paymentMethod === 'scan') {
          if (!paymentDetails.transactionId || !paymentDetails.senderName) {
            toast({ title: 'Details Missing', description: 'Please enter transaction ID and sender name.', variant: 'destructive' });
            return;
          }
        }
        setCurrentStep(6); // Go to Review
        return;
      }
      // Functionally submit if Free
      const success = await submitRegistration();
      if (success) {
        setIsComplete(true);
        toast({ title: 'Registration Successful! 🎉', description: 'Your story has been submitted successfully.' });
      }
    }

    if (currentStep === 6) { // Final Review (Payment Mode)
      const success = await submitRegistration();
      if (success) {
        setIsComplete(true);
        toast({ title: 'Registration Successful! 🎉', description: 'Your story has been submitted successfully.' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };


  if (isComplete) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-warm">
        <div className="max-w-md w-full mx-auto p-8 text-center animate-scale-in">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6 success-tick">
            <Check className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Registration Complete!</h1>
          <p className="text-muted-foreground mb-8">Your registration has been submitted successfully.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link to="/dashboard" className="flex-1"><Button variant="hero" size="lg" className="w-full">Go to Dashboard</Button></Link>
            <Link to="/" className="flex-1"><Button variant="outline" size="lg" className="w-full">Back to Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-warm page-enter">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Join the <span className="text-gradient">Competition</span></h1>
            <p className="text-muted-foreground">Complete your registration in {steps.length} simple steps</p>
          </div>

          {/* Progress Steps */}
          <div className="relative mb-12">
            <div className="flex justify-between items-center">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col items-center relative z-10">
                  <div className={cn('w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500', currentStep > step.id ? 'bg-green-500 text-primary-foreground' : currentStep === step.id ? 'bg-primary text-primary-foreground shadow-glow' : 'bg-muted text-muted-foreground')}>
                    {currentStep > step.id ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <step.icon className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <span className={cn('mt-2 text-xs md:text-sm font-medium text-center', currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground')}>{step.title}</span>
                </div>
              ))}
            </div>
            <div className="absolute top-6 md:top-7 left-0 right-0 h-0.5 bg-muted -z-0">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 relative">

            {/* Step 1: Get Started (Email Verification) */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Get Started</h2>
                  <p className="text-muted-foreground mt-2">Select your event and verify your email</p>
                </div>

                {/* Email Verification Section */}
                <div className="space-y-6">
                  {emailStep === 'email' && (
                    <div className="space-y-4">
                      {/* Event Selection - Must be selected before sending magic link */}
                      {!isEventLocked && (
                        <div className="space-y-2">
                          <Label>Select Event <span className="text-destructive">*</span></Label>
                          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                            <SelectTrigger><SelectValue placeholder="Choose an event to participate in" /></SelectTrigger>
                            <SelectContent>
                              {events.filter(e => e.event_type === 'school' || e.event_type === 'college' || e.event_type === 'both').map((event) => (<SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {isEventLocked && selectedEventId && (
                        <div className="space-y-2">
                          <Label>Selected Event</Label>
                          <div className="p-3 bg-muted rounded-md text-sm font-medium">
                            {events.find(e => e.id === selectedEventId)?.name || 'Loading...'}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Email Address <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input type="email" placeholder="Enter your email address" value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)} className="pl-10" required />
                        </div>
                      </div>
                      <Button onClick={handleSendMagicLink} disabled={sendingEmail || !verificationEmail.includes('@') || !selectedEventId} className="w-full" variant="hero" size="lg">{sendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <>Send Magic Link<ArrowRight className="w-4 h-4 ml-2" /></>}</Button>
                    </div>
                  )}
                  {emailStep === 'sent' && (
                    <div className="space-y-4 text-center">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <Mail className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                        <h3 className="font-semibold text-blue-800 mb-2">Check Your Email</h3>
                        <p className="text-blue-600 text-sm mb-4">We've sent a magic link to <strong>{verificationEmail}</strong></p>
                        <p className="text-blue-600 text-xs">Click the link in the email to continue your registration.</p>
                        {lastMagicLinkRedirectUrl && (
                          <p className="text-blue-700 text-xs mt-3">
                            Expected redirect after verification:{" "}
                            <span className="font-mono break-all">{lastMagicLinkRedirectUrl}</span>
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="hero" 
                        className="w-full" 
                        onClick={() => {
                          const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                          if (isMobile) {
                            window.location.href = 'mailto:';
                          } else {
                            window.open('https://mail.google.com', '_blank');
                          }
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Open Email Inbox
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setEmailStep('email')}>Change Email Address</Button>
                      <Button variant="outline" className="w-full" onClick={handleSendMagicLink} disabled={sendingEmail}>{sendingEmail ? 'Sending...' : 'Resend Magic Link'}</Button>
                    </div>
                  )}
                  {emailStep === 'verified' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
                      <div className="bg-green-100 p-2 rounded-full"><Check className="w-5 h-5 text-green-600" /></div>
                      <div className="flex-1">
                        <p className="text-green-800 font-medium">Email Verified</p>
                        <p className="text-green-600 text-sm">{verificationEmail}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleNext} disabled={emailStep !== 'verified'} variant="hero" size="lg" className="w-full sm:w-auto">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Role Selection */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h2 className="font-display text-2xl font-semibold text-foreground">Select Your Role</h2>
                  <p className="text-muted-foreground mt-2">Choose the category that best describes you</p>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div
                      className={cn("p-6 border-2 rounded-2xl cursor-pointer transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center text-center gap-4 relative", role === 'school' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary ring-offset-2" : "border-border")}
                      onClick={() => { setRole('school'); }}
                    >
                      {role === 'school' && <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <School className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">School Student</h3>
                        <p className="text-sm text-muted-foreground">For students in grades 3-12</p>
                      </div>
                    </div>

                    <div
                      className={cn("p-6 border-2 rounded-2xl cursor-pointer transition-all hover:border-primary hover:bg-primary/5 flex flex-col items-center text-center gap-4 relative", role === 'college' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary ring-offset-2" : "border-border")}
                      onClick={() => { setRole('college'); }}
                    >
                      {role === 'college' && <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                        <GraduationCap className="w-10 h-10" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">College Student</h3>
                        <p className="text-sm text-muted-foreground">For undergraduate & grad students</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
                  <Button onClick={handleNext} disabled={!role} variant="hero" size="lg" className="w-full sm:w-auto">
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Personal Info */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input placeholder="Enter first name" value={personalInfo.firstName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, firstName: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Enter last name" value={personalInfo.lastName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, lastName: e.target.value }))} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address (Verified)</Label>
                  <div className="relative">
                    <Input type="email" value={personalInfo.email} className="bg-muted pr-10" readOnly disabled />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><ShieldCheck className="w-5 h-5 text-green-500" /></div>
                  </div>
                </div>

                {/* School or College Name */}
                {role === 'school' && (
                  <div className="space-y-2"><Label>School Name</Label><Input placeholder="Enter your school name" value={personalInfo.schoolName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, schoolName: e.target.value }))} required /></div>
                )}
                {role === 'college' && (
                  <>
                    <div className="space-y-2"><Label>College / Institution Name</Label><Input placeholder="Enter your college or institution" value={personalInfo.collegeName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, collegeName: e.target.value }))} required /></div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Degree</Label><Input placeholder="e.g. B.Tech, B.Sc" value={personalInfo.degree} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, degree: e.target.value }))} required /></div>
                      <div className="space-y-2"><Label>Branch/Major</Label><Input placeholder="e.g. Computer Science" value={personalInfo.branch} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, branch: e.target.value }))} required /></div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10"><span className="text-sm font-medium text-muted-foreground">IN+91</span></div>
                    <Input type="tel" placeholder="Enter phone number" value={personalInfo.phone} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, phone: e.target.value }))} className="pl-16" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="Your age" value={personalInfo.age} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, age: e.target.value }))} required min={1} max={100} /></div>
                  <div className="space-y-2"><Label>City</Label><Input placeholder="Your city" value={personalInfo.city} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, city: e.target.value }))} required /></div>
                </div>
                {/* Show selected event (read-only since selected in Step 1) */}
                <div className="space-y-2">
                  <Label>Selected Event</Label>
                  <div className="p-3 bg-muted rounded-md text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {events.find(e => e.id === selectedEventId)?.name || 'No event selected'}
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
                  <Button onClick={handleNext} variant="hero">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {/* Step 4: Story Details */}
            {/* Step 4 (Story Details) */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Story Details</h2>
                <div className="space-y-2"><Label>Story Title</Label><Input placeholder="Enter your story title" value={storyDetails.title} onChange={(e) => setStoryDetails((prev) => ({ ...prev, title: e.target.value }))} required /></div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={storyDetails.category} onValueChange={(value) => setStoryDetails((prev) => ({ ...prev, category: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fiction">Fiction</SelectItem><SelectItem value="non-fiction">Non-Fiction</SelectItem><SelectItem value="poetry">Poetry</SelectItem><SelectItem value="folktale">Folktale</SelectItem><SelectItem value="adventure">Adventure</SelectItem><SelectItem value="mystery">Mystery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{role === 'college' ? 'Year of Studying' : 'Class Level'}</Label>
                    <Select value={storyDetails.classLevel} onValueChange={(value) => setStoryDetails((prev) => ({ ...prev, classLevel: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        {role === 'school' ? (
                          <>
                            <SelectItem value="Tiny Tales">Tiny Tales (Grades 3-5)</SelectItem>
                            <SelectItem value="Young Dreamers">Young Dreamers (Grades 6-8)</SelectItem>
                            <SelectItem value="Story Champions">Story Champions (Grades 9-12)</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="1st Year">1st Year</SelectItem>
                            <SelectItem value="2nd Year">2nd Year</SelectItem>
                            <SelectItem value="3rd Year">3rd Year</SelectItem>
                            <SelectItem value="4th Year">4th Year</SelectItem>
                            <SelectItem value="5th Year">5th Year</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Story Description</Label>
                  <textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Describe your story..." value={storyDetails.description} onChange={(e) => setStoryDetails((prev) => ({ ...prev, description: e.target.value }))} required />
                </div>

                {/* Media Upload Section */}
                <div className="animate-fade-in space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Upload Story Content</h3>
                  {role === 'school' ? (
                    <div className="space-y-2">
                      <Label>Upload Video</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                        <input type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setStoryDetails((prev) => ({ ...prev, videoFile: file })); }} className="hidden" id="video-upload" />
                        <label htmlFor="video-upload" className="cursor-pointer">
                          {storyDetails.videoFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-600"><Check className="w-5 h-5" /><span>{storyDetails.videoFile.name}</span></div>
                          ) : (
                            <div className="space-y-2"><div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center"><Video className="w-6 h-6 text-muted-foreground" /></div><p className="text-muted-foreground">Click to upload your story video</p><p className="text-xs text-muted-foreground">MP4, MOV, or AVI (max 500MB)</p></div>
                          )}
                        </label>
                      </div>
                    </div>
                  ) : (
                    // College: PDF only
                    <div className="space-y-2">
                      <Label>Upload Story (PDF)</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                        <input type="file" accept=".pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) setStoryDetails((prev) => ({ ...prev, storyPdf: file })); }} className="hidden" id="pdf-upload" />
                        <label htmlFor="pdf-upload" className="cursor-pointer">
                          {storyDetails.storyPdf ? (
                            <div className="flex flex-col items-center justify-center gap-2 text-red-600">
                              <FileType className="w-8 h-8" />
                              <span className="text-sm">{storyDetails.storyPdf.name}</span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center"><FileType className="w-6 h-6 text-muted-foreground" /></div>
                              <p className="text-muted-foreground">Click to upload your story PDF</p>
                              <p className="text-xs text-muted-foreground">PDF format only (max 50MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
                  <Button onClick={handleNext} variant="hero">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </div>
            )}

            {/* Step 5: Payment (Only if enabled and Step 5) */}
            {currentStep === 5 && isPaymentEnabled && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Choose a Payment Method</h2>
                <div className="space-y-6">
                  <RadioGroup defaultValue="upi" value={paymentMethod} onValueChange={(val) => { setPaymentMethod(val as 'upi' | 'scan'); setSelectedUpiApp(null); setPaymentDetails({ transactionId: '', senderName: '' }); }} className="grid gap-4 md:grid-cols-2">
                    <div className={cn("flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-muted/50", paymentMethod === 'upi' ? "border-primary bg-primary/5" : "border-border")} onClick={() => setPaymentMethod('upi')}>
                      <RadioGroupItem value="upi" id="upi" className="sr-only" /><Wallet className={cn("w-10 h-10 mb-3", paymentMethod === 'upi' ? "text-primary" : "text-muted-foreground")} /><Label htmlFor="upi" className="font-semibold text-lg cursor-pointer">Select UPI App</Label>
                    </div>
                    <div className={cn("flex flex-col items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:bg-muted/50", paymentMethod === 'scan' ? "border-primary bg-primary/5" : "border-border")} onClick={() => setPaymentMethod('scan')}>
                      <RadioGroupItem value="scan" id="scan" className="sr-only" /><Scan className={cn("w-10 h-10 mb-3", paymentMethod === 'scan' ? "text-primary" : "text-muted-foreground")} /><Label htmlFor="scan" className="font-semibold text-lg cursor-pointer">Scan & Pay</Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 animate-fade-in border-t pt-6 text-center">
                      <Label className="text-base font-semibold">Select your preferred UPI App</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[{ id: 'gpay', name: 'Google Pay', color: 'bg-blue-500' }, { id: 'phonepe', name: 'PhonePe', color: 'bg-purple-600' }, { id: 'paytm', name: 'Paytm', color: 'bg-cyan-500' }, { id: 'bhim', name: 'BHIM', color: 'bg-orange-500' }].map(app => (
                          <div key={app.id} className={cn("flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all", selectedUpiApp === app.id ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary/50")} onClick={() => { setSelectedUpiApp(app.id); toast({ title: `${app.name} Selected`, description: "Proceed to pay in the app." }); }}>
                            <div className={cn("w-12 h-12 rounded-full mb-2 flex items-center justify-center text-white font-bold", app.color)}>{app.name[0]}</div><span className="text-sm font-medium">{app.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'scan' && (
                    <div className="space-y-6 animate-fade-in border-t pt-6">
                      <div className="flex flex-col items-center">
                        <Button onClick={() => setShowQrCode(true)} variant="outline" className="mb-4"><Scan className="w-4 h-4 mr-2" /> Show QR Code</Button>
                        {showQrCode && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
                            <div className="bg-white rounded-xl p-6 max-w-sm w-full relative shadow-2xl">
                              <button onClick={() => setShowQrCode(false)} className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full">✕</button>
                              <h3 className="text-xl font-bold text-center mb-4 text-black">Scan to Pay</h3>
                              <div className="aspect-square bg-white border-2 border-black p-2 mb-4 rounded-lg flex items-center justify-center">
                                {selectedEvent?.qr_code_url ? (
                                  <img src={selectedEvent.qr_code_url} alt="Payment QR" className="w-full h-full object-contain" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400"><Scan className="w-24 h-24 opacity-20" /></div>
                                )}
                              </div>
                              <p className="text-center text-sm text-gray-500">Scan this QR code with any UPI app</p>
                              <Button className="w-full mt-4" onClick={() => setShowQrCode(false)}>Done Scanning</Button>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground text-center max-w-md">Scan the QR code to pay. After payment, enter the details below to verify.</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><Label>UPI Transaction ID</Label><Input placeholder="e.g. 123456789012" value={paymentDetails.transactionId} onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionId: e.target.value }))} /></div>
                        <div className="space-y-2"><Label>Sender Name</Label><Input placeholder="Name on bank account" value={paymentDetails.senderName} onChange={(e) => setPaymentDetails(prev => ({ ...prev, senderName: e.target.value }))} /></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6 (or 5): Review */}
            {((isPaymentEnabled && currentStep === 6) || (!isPaymentEnabled && currentStep === 5)) && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Review Your Submission</h2>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Personal Information</h3>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">Role:</span> <span className="capitalize">{role} Student</span></p>
                      <p><span className="text-muted-foreground">Name:</span> {personalInfo.firstName} {personalInfo.lastName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {personalInfo.email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> +91 {personalInfo.phone}</p>
                      <p><span className="text-muted-foreground">Age:</span> {personalInfo.age}</p>
                      <p><span className="text-muted-foreground">City:</span> {personalInfo.city}</p>
                      <p><span className="text-muted-foreground">City:</span> {personalInfo.city}</p>
                      {role === 'school' && <p><span className="text-muted-foreground">School:</span> {personalInfo.schoolName}</p>}
                      {role === 'college' && (
                        <>
                          <p><span className="text-muted-foreground">College:</span> {personalInfo.collegeName}</p>
                          <p><span className="text-muted-foreground">Degree:</span> {personalInfo.degree}</p>
                          <p><span className="text-muted-foreground">Branch:</span> {personalInfo.branch}</p>
                        </>
                      )}
                      <p><span className="text-muted-foreground">Event:</span> {events.find(e => e.id === selectedEventId)?.name}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Story Details</h3>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      {/* Book Preview on Left */}
                      {role === 'college' && (
                        <div className="hidden md:flex flex-shrink-0 items-center justify-center pl-2 pr-6 border-r border-border/50">
                          <div className="relative w-40 h-56 bg-gradient-to-br from-primary to-rose-900 rounded-xl flex items-center justify-center shadow-inner overflow-hidden">
                            {/* Studio Light Effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>

                            {/* 3D Book Container */}
                            <div className="relative w-28 h-40 preserve-3d rotate-y-[-25deg] rotate-x-[10deg] shadow-2xl transition-transform duration-700 ease-out hover:rotate-y-[-15deg] hover:rotate-x-[0deg] group perspective-1000">

                              {/* Front Cover */}
                              <div className="absolute inset-0 bg-white z-20 rounded-[2px] shadow-sm transform translate-z-[6px]">
                                {storyDetails.coverPage ? (
                                  <img src={URL.createObjectURL(storyDetails.coverPage)} alt="Cover" className="w-full h-full object-cover rounded-[2px]" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center bg-white text-center p-2 border border-gray-100">
                                    <FileText className="w-8 h-8 text-primary/40 mb-2" />
                                    <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Book<br />Cover</span>
                                  </div>
                                )}
                                {/* Sheen/Reflection */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50 pointer-events-none rounded-[2px]"></div>
                                {/* Spine Fold Shadow */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/20 to-transparent z-30"></div>
                              </div>

                              {/* Pages / Thickness (Right Side) */}
                              <div className="absolute top-[2px] bottom-[2px] left-full w-[12px] bg-[#fffbf7] origin-left rotate-y-[90deg] border-l border-gray-200/50 shadow-inner flex flex-col justify-center overflow-hidden">
                                <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_1px,rgba(0,0,0,0.08)_1px,rgba(0,0,0,0.08)_2px)]"></div>
                              </div>

                              {/* Fake Back Shadow for Depth */}
                              <div className="absolute inset-0 bg-black/40 translate-z-[-6px] translate-x-[4px] blur-sm rounded-md"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Text Details */}
                      <div className="flex-1 space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Title:</span> {storyDetails.title}</p>
                        <p><span className="text-muted-foreground">Category:</span> {storyDetails.category}</p>
                        <p><span className="text-muted-foreground">Class Level:</span> {storyDetails.classLevel}</p>
                        <p><span className="text-muted-foreground">Description:</span> {storyDetails.description}</p>
                        {role === 'school' && <p><span className="text-muted-foreground">Video:</span> {storyDetails.videoFile?.name}</p>}
                        {role === 'college' && (
                          <>
                            <p><span className="text-muted-foreground">PDF:</span> {storyDetails.storyPdf?.name}</p>
                            <p><span className="text-muted-foreground">Cover:</span> {storyDetails.coverPage?.name}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {isPaymentEnabled && (
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold text-foreground">Payment Details</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">Method:</span> {paymentMethod === 'upi' ? 'UPI App' : 'Scan & Pay'}</p>
                        {paymentMethod === 'scan' && (
                          <>
                            <p><span className="text-muted-foreground">Transaction ID:</span> {paymentDetails.transactionId}</p>
                            <p><span className="text-muted-foreground">Sender:</span> {paymentDetails.senderName}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5 Payment Buttons */}
            {currentStep === 5 && isPaymentEnabled && (
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
                <Button onClick={handleNext} variant="hero">Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </div>
            )}

            {/* Step 6 Review Buttons */}
            {((isPaymentEnabled && currentStep === 6) || (!isPaymentEnabled && currentStep === 5)) && (
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4 mr-2" /> Previous</Button>
                <Button onClick={handleNext} disabled={isSubmitting} variant="hero" className="ml-auto">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Check className="w-4 h-4 mr-2" />Submit Registration</>}
                </Button>
              </div>
            )}

          </div>
          <div className="text-center mt-8"><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link></div>
        </div>
      </div>
    </div >
  );
};

export default Register;
