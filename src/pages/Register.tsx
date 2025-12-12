import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, User, FileText, ArrowRight, ArrowLeft, Loader2, Calendar, Phone, ShieldCheck, CreditCard, Landmark, Scan, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
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
}

const stepsWithPayment = [
  { id: 1, title: 'Verify Phone', icon: Phone },
  { id: 2, title: 'Personal Info', icon: User },
  { id: 3, title: 'Story Details', icon: FileText },
  { id: 4, title: 'Payment', icon: CreditCard },
  { id: 5, title: 'Review & Submit', icon: Check },
];

const stepsFree = [
  { id: 1, title: 'Verify Phone', icon: Phone },
  { id: 2, title: 'Personal Info', icon: User },
  { id: 3, title: 'Story Details', icon: FileText },
  { id: 4, title: 'Review & Submit', icon: Check },
];

const WEBHOOK_URL = 'https://kamalesh-tech-aiii.app.n8n.cloud/webhook/youtube-upload';

// Store user session based on Supabase auth user
const saveUserSession = (phone: string, firstName: string, userId: string): void => {
  const phoneDigits = phone.replace(/\D/g, '');
  localStorage.setItem('story_seed_user_phone', phoneDigits);
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

  // Phone verification states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState<'phone' | 'otp' | 'verified'>('phone');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(null);

  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    city: '',
  });
  const [storyDetails, setStoryDetails] = useState<{
    title: string;
    category: string;
    classLevel: string;
    description: string;
    videoFile: File | null;
  }>({
    title: '',
    category: '',
    classLevel: '',
    description: '',
    videoFile: null,
  });

  // Derived state
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
        .select('id, name, description, is_payment_enabled, qr_code_url')
        .eq('is_active', true);

      if (!eventsError && eventsData) {
        setEvents(eventsData as unknown as Event[]);
      }
    };
    fetchData();
  }, []);

  // Lock event selection if eventId is in URL
  useEffect(() => {
    if (eventIdFromUrl) {
      setSelectedEventId(eventIdFromUrl);
      setIsEventLocked(true);
    }
  }, [eventIdFromUrl]);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.phone) {
        const currentPhone = session.user.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
        setAuthenticatedUserId(session.user.id);
        setPhoneNumber(currentPhone);
        setOtpStep('verified');
        setCurrentStep(2);
        setPersonalInfo(prev => ({ ...prev, phone: currentPhone }));
        localStorage.setItem('story_seed_user_phone', currentPhone);
        localStorage.setItem('story_seed_user_id', session.user.id);
      } else {
        setPhoneNumber('');
        setOtpStep('phone');
        setCurrentStep(1);
        setAuthenticatedUserId(null);
        localStorage.removeItem('story_seed_user_phone');
        localStorage.removeItem('story_seed_user_name');
        localStorage.removeItem('story_seed_user_id');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session.user.phone) {
        const currentPhone = session.user.phone.replace('+91', '').replace(/\D/g, '').slice(-10);
        setAuthenticatedUserId(session.user.id);
        setPhoneNumber(currentPhone);
        setOtpStep('verified');
        setCurrentStep(2);
        setPersonalInfo(prev => ({ ...prev, phone: currentPhone }));
        localStorage.setItem('story_seed_user_phone', currentPhone);
        localStorage.setItem('story_seed_user_id', session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setPhoneNumber('');
        setOtpStep('phone');
        setCurrentStep(1);
        setAuthenticatedUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send OTP
  const handleSendOTP = async () => {
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({ title: 'Invalid Phone Number', description: 'Please enter a valid 10-digit phone number.', variant: 'destructive' });
      return;
    }
    setSendingOtp(true);
    try {
      const formattedPhone = `+91${phoneDigits}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      toast({ title: 'OTP Sent', description: 'Please check your phone for the verification code.' });
      setOtpStep('otp');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({ title: 'Failed to Send OTP', description: error.message || 'Please try again later.', variant: 'destructive' });
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter the 6-digit verification code.', variant: 'destructive' });
      return;
    }
    setVerifyingOtp(true);
    try {
      const phoneDigits = phoneNumber.replace(/\D/g, '');
      const formattedPhone = `+91${phoneDigits}`;
      const { data, error } = await supabase.auth.verifyOtp({ phone: formattedPhone, token: otp, type: 'sms' });
      if (error) throw error;
      if (data.user) {
        setAuthenticatedUserId(data.user.id);
        setOtpStep('verified');
        setCurrentStep(2);
        setPersonalInfo(prev => ({ ...prev, phone: phoneDigits }));
        localStorage.setItem('story_seed_user_phone', phoneDigits);
        localStorage.setItem('story_seed_user_id', data.user.id);
        toast({ title: 'Phone Verified! ✓', description: 'You can now proceed with registration.' });
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({ title: 'Verification Failed', description: error.message || 'Invalid OTP. Please try again.', variant: 'destructive' });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validateStep2 = () => {
    const { firstName, lastName, email, age, city } = personalInfo;
    if (!firstName || !lastName || !email || !age || !city) {
      toast({ title: 'Missing information', description: 'Please fill in all personal information fields.', variant: 'destructive' });
      return false;
    }
    if (!selectedEventId) {
      toast({ title: 'Event Required', description: 'Please select an event to participate in.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const { title, category, classLevel, description, videoFile } = storyDetails;
    if (!title || !category || !classLevel || !description || !videoFile) {
      toast({ title: 'Missing story details', description: 'Please complete all fields and upload a video.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const submitRegistration = async () => {
    if (!selectedEventId || !authenticatedUserId) {
      toast({ title: 'Error', description: 'Please verify your phone number first.', variant: 'destructive' });
      return false;
    }
    setIsSubmitting(true);
    try {
      const phoneDigits = personalInfo.phone.replace(/\D/g, '');
      const { data: existingByPhone } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', selectedEventId)
        .ilike('phone', `%${phoneDigits.slice(-10)}`);

      if (existingByPhone && existingByPhone.length > 0) {
        toast({ title: 'Already Registered', description: 'You have already registered for this event.', variant: 'destructive' });
        setIsSubmitting(false);
        return false;
      }

      const sessionId = getSessionId();
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
        // We might want to save transaction details if payment was enabled
      });

      if (dbError) {
        console.error('Database error:', dbError);
        toast({ title: 'Registration Failed', description: 'Could not save registration. Please try again.', variant: 'destructive' });
        return false;
      }

      saveUserSession(phoneDigits, personalInfo.firstName, authenticatedUserId);
      const selectedEvent = events.find(e => e.id === selectedEventId);

      // Webhook
      const formData = new FormData();
      formData.append('user_id', authenticatedUserId);
      formData.append('session_id', sessionId);
      formData.append('event_id', selectedEventId);
      formData.append('event_name', selectedEvent?.name || '');
      formData.append('first_name', personalInfo.firstName);
      formData.append('last_name', personalInfo.lastName);
      formData.append('email', personalInfo.email);
      formData.append('phone', phoneDigits);
      formData.append('age', personalInfo.age);
      formData.append('city', personalInfo.city);
      formData.append('story_title', storyDetails.title);
      formData.append('category', storyDetails.category);
      formData.append('class_level', storyDetails.classLevel);
      formData.append('story_description', storyDetails.description);
      if (storyDetails.videoFile) formData.append('video', storyDetails.videoFile);

      try {
        await fetch(WEBHOOK_URL, { method: 'POST', body: formData, mode: 'no-cors' });
        console.log('Webhook sent successfully');
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
    if (currentStep === 1) return; // Handled by OTP

    if (currentStep === 2) {
      if (!validateStep2()) return;
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (!validateStep3()) return;
      if (isPaymentEnabled) {
        setCurrentStep(4); // Go to Payment
      } else {
        setCurrentStep(4); // Go to Review (which is step 4 in Free flow)
      }
      return;
    }

    if (currentStep === 4) {
      // If Payment Enabled, Step 4 is Payment.
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
        setCurrentStep(5); // Go to Review
        return;
      } else {
        // If Payment Disabled, Step 4 is Review. Submit.
        const success = await submitRegistration();
        if (success) {
          setIsComplete(true);
          toast({ title: 'Registration Successful! 🎉', description: 'Your story has been submitted successfully.' });
        }
        return;
      }
    }

    if (currentStep === 5) {
      // Must be Paid flow review step
      const success = await submitRegistration();
      if (success) {
        setIsComplete(true);
        toast({ title: 'Registration Successful! 🎉', description: 'Your story has been submitted successfully.' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 2) setCurrentStep(currentStep - 1);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    const phoneDigits = digits.startsWith('91') ? digits.slice(2) : digits;
    if (phoneDigits.length <= 10) setPhoneNumber(phoneDigits);
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
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
            {/* Step 1: Phone Verification */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4"><Phone className="w-8 h-8 text-primary" /></div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">Verify Your Phone</h2>
                  <p className="text-muted-foreground mt-2">We'll send you a verification code to confirm your identity</p>
                </div>
                {otpStep === 'phone' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10"><span className="text-sm font-medium text-muted-foreground">IN+91</span></div>
                        <Input type="tel" placeholder="Enter Your Phone Number" value={phoneNumber} onChange={handlePhoneChange} className="pl-16" maxLength={10} required />
                      </div>
                    </div>
                    <Button onClick={handleSendOTP} disabled={sendingOtp || phoneNumber.length !== 10} className="w-full" variant="hero" size="lg">{sendingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <>Send Verification Code<ArrowRight className="w-4 h-4 ml-2" /></>}</Button>
                  </div>
                )}
                {otpStep === 'otp' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-center block">Enter 6-digit OTP</Label>
                      <div className="flex justify-center">
                        <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} /><InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-2">Sent to +91 {phoneNumber}</p>
                    </div>
                    <Button onClick={handleVerifyOTP} disabled={verifyingOtp || otp.length !== 6} className="w-full" variant="hero" size="lg">
                      {verifyingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-2" />Verify & Continue</>}
                    </Button>
                    <Button variant="ghost" className="w-full" onClick={() => { setOtpStep('phone'); setOtp(''); }}>Change Phone Number</Button>
                  </div>
                )}
                {otpStep === 'verified' && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"><Check className="w-8 h-8 text-green-600" /></div>
                    <p className="text-green-600 font-medium">Phone Verified Successfully!</p>
                    <Button onClick={() => setCurrentStep(2)} variant="hero" size="lg" className="w-full">Continue to Registration<ArrowRight className="w-4 h-4 ml-2" /></Button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Personal Info */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input placeholder="Enter first name" value={personalInfo.firstName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, firstName: e.target.value }))} required /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Enter last name" value={personalInfo.lastName} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, lastName: e.target.value }))} required /></div>
                </div>
                <div className="space-y-2"><Label>Email Address</Label><Input type="email" placeholder="your@email.com" value={personalInfo.email} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, email: e.target.value }))} required /></div>
                <div className="space-y-2">
                  <Label>Phone Number (Verified)</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10"><span className="text-sm font-medium text-muted-foreground">IN+91</span></div>
                    <Input type="tel" value={personalInfo.phone} className="pl-16 bg-muted" readOnly disabled />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2"><ShieldCheck className="w-5 h-5 text-green-500" /></div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="Your age" value={personalInfo.age} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, age: e.target.value }))} required min={1} max={100} /></div>
                  <div className="space-y-2"><Label>City</Label><Input placeholder="Your city" value={personalInfo.city} onChange={(e) => setPersonalInfo((prev) => ({ ...prev, city: e.target.value }))} required /></div>
                </div>
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={isEventLocked}>
                    <SelectTrigger><SelectValue placeholder="Choose an event to participate in" /></SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (<SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Story Details */}
            {currentStep === 3 && (
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
                    <Label>Class Level</Label>
                    <Select value={storyDetails.classLevel} onValueChange={(value) => setStoryDetails((prev) => ({ ...prev, classLevel: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select class level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tiny Tales">Tiny Tales (Grades 3-5)</SelectItem><SelectItem value="Young Dreamers">Young Dreamers (Grades 6-8)</SelectItem><SelectItem value="Story Champions">Story Champions (Grades 9-12)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Story Description</Label>
                  <textarea className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Describe your story..." value={storyDetails.description} onChange={(e) => setStoryDetails((prev) => ({ ...prev, description: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Upload Video</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) setStoryDetails((prev) => ({ ...prev, videoFile: file })); }} className="hidden" id="video-upload" />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      {storyDetails.videoFile ? (
                        <div className="flex items-center justify-center gap-2 text-green-600"><Check className="w-5 h-5" /><span>{storyDetails.videoFile.name}</span></div>
                      ) : (
                        <div className="space-y-2"><div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center"><FileText className="w-6 h-6 text-muted-foreground" /></div><p className="text-muted-foreground">Click to upload your story video</p><p className="text-xs text-muted-foreground">MP4, MOV, or AVI (max 500MB)</p></div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment (Only if enabled) */}
            {currentStep === 4 && isPaymentEnabled && (
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

            {/* Step 5 (or 4 if free): Review */}
            {((isPaymentEnabled && currentStep === 5) || (!isPaymentEnabled && currentStep === 4)) && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="font-display text-2xl font-semibold text-foreground">Review Your Submission</h2>
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Personal Information</h3>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <p><span className="text-muted-foreground">Name:</span> {personalInfo.firstName} {personalInfo.lastName}</p>
                      <p><span className="text-muted-foreground">Email:</span> {personalInfo.email}</p>
                      <p><span className="text-muted-foreground">Phone:</span> +91 {personalInfo.phone}</p>
                      <p><span className="text-muted-foreground">Age:</span> {personalInfo.age}</p>
                      <p><span className="text-muted-foreground">City:</span> {personalInfo.city}</p>
                      <p><span className="text-muted-foreground">Event:</span> {events.find(e => e.id === selectedEventId)?.name}</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">Story Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">Title:</span> {storyDetails.title}</p>
                      <p><span className="text-muted-foreground">Category:</span> {storyDetails.category}</p>
                      <p><span className="text-muted-foreground">Class Level:</span> {storyDetails.classLevel}</p>
                      <p><span className="text-muted-foreground">Video:</span> {storyDetails.videoFile?.name}</p>
                      <p><span className="text-muted-foreground">Description:</span> {storyDetails.description}</p>
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

            {/* Navigation Buttons */}
            {currentStep > 1 && (
              <div className="flex justify-between mt-8">
                {currentStep > 2 && <Button variant="outline" onClick={handlePrev}><ArrowLeft className="w-4 h-4 mr-2" />Previous</Button>}
                {currentStep === 2 && <div />}
                <Button onClick={handleNext} disabled={isSubmitting} variant="hero" className="ml-auto">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> :
                    ((isPaymentEnabled && currentStep === 5) || (!isPaymentEnabled && currentStep === 4)) ? <><Check className="w-4 h-4 mr-2" />Submit Registration</> :
                      <>Next<ArrowRight className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            )}
          </div>
          <div className="text-center mt-8"><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">← Back to Home</Link></div>
        </div>
      </div>
    </div>
  );
};

export default Register;
