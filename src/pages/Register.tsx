import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, User, FileText, ArrowRight, ArrowLeft, Loader2, Calendar, Mail, ShieldCheck, CreditCard, Scan, Wallet, FileType, GraduationCap, School, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  event_type: 'school' | 'college' | 'both' | null;
}

const steps = [
  { id: 1, title: 'Verification', icon: ShieldCheck },
  { id: 2, title: 'Unique Key', icon: ShieldCheck },
  { id: 3, title: 'Select Role', icon: School },
  { id: 4, title: 'Personal Info', icon: User },
  { id: 5, title: 'Story Details', icon: FileText },
  { id: 6, title: 'Review & Submit', icon: Check },
];

const CLG_WEBHOOK_URL = 'https://kamalesh-tech-aiii.app.n8n.cloud/webhook/clg_registration';

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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'initializing' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<'school' | 'college' | null>(() => {
    const savedRole = localStorage.getItem('story_seed_user_role');
    return (savedRole as 'school' | 'college') || null;
  });

  useEffect(() => {
    if (role) {
      localStorage.setItem('story_seed_user_role', role);
    }
  }, [role]);

  const [verificationEmail, setVerificationEmail] = useState('');
  const [emailStep, setEmailStep] = useState<'pending' | 'verified'>('pending');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [uniqueKey, setUniqueKey] = useState(searchParams.get('key') || '');
  const [isKeyVerified, setIsKeyVerified] = useState(false);
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
    classLevel: string;
    description: string;
    videoFile: File | null;
    storyPdf: File | null;
  }>({
    title: '',
    category: '',
    classLevel: '',
    description: '',
    videoFile: null,
    storyPdf: null,
  });

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

  useEffect(() => {
    if (eventIdFromUrl && events.length > 0) {
      const event = events.find(e => e.id === eventIdFromUrl);
      if (event) {
        setSelectedEventId(eventIdFromUrl);
        setIsEventLocked(true);
        if (event.event_type === 'school') setRole('school');
        else if (event.event_type === 'college') setRole('college');
      }
    }
  }, [eventIdFromUrl, events]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email) {
        setAuthenticatedUserId(session.user.id);
        setVerificationEmail(session.user.email);
        setEmailStep('verified');
        setPersonalInfo(prev => ({ ...prev, email: session.user.email || '' }));
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        setAuthenticatedUserId(session.user.id);
        setVerificationEmail(session.user.email);
        setEmailStep('verified');
        setPersonalInfo(prev => ({ ...prev, email: session.user.email || '' }));
        toast({ title: 'Signed In!', description: 'Please enter your unique key.', variant: 'success' });
        setCurrentStep(2);
      } else if (event === 'SIGNED_OUT') {
        setVerificationEmail('');
        setEmailStep('pending');
        setCurrentStep(1);
        setAuthenticatedUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!selectedEventId) {
      toast({ title: 'Event Required', description: 'Please select an event first.', variant: 'destructive' });
      return;
    }
    setIsSigningIn(true);
    try {
      const redirectUrl = `${window.location.origin}/register?eventId=${selectedEventId}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
      setIsSigningIn(false);
    }
  };

  const validateStep1 = () => {
    if (emailStep !== 'verified') {
      toast({ title: 'Email Required', description: 'Please sign in first.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    if (!uniqueKey) {
      toast({ title: 'Key Required', description: 'Please enter your unique key/OTP.', variant: 'destructive' });
      return false;
    }

    const { data: reg } = await supabase.from('registrations').select('event_id, payment_status, role').eq('unique_key', uniqueKey.toUpperCase()).maybeSingle();
    const { data: clgReg } = await supabase.from('clg_registrations').select('event_id, payment_status').eq('unique_key', uniqueKey.toUpperCase()).maybeSingle();

    const existingKey = reg || clgReg;
    if (!existingKey) {
      toast({ title: 'Invalid Key', description: 'This key is invalid.', variant: 'destructive' });
      return false;
    }
    if (existingKey.event_id !== selectedEventId) {
      toast({ title: 'Invalid Event', description: 'This key is for another event.', variant: 'destructive' });
      return false;
    }
    if (existingKey.payment_status !== 'paid') {
      toast({ title: 'Payment Pending', description: 'Your payment is being verified.', variant: 'destructive' });
      return false;
    }

    setIsKeyVerified(true);
    if (clgReg) setRole('college');
    else if (reg) setRole('school');
    return true;
  };

  const validateStep3 = () => {
    const { firstName, lastName, email, age, city } = personalInfo;
    if (!firstName || !lastName || !email || !age || !city) {
      toast({ title: 'Missing information', description: 'Please fill all fields.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    const { title, category, classLevel, description } = storyDetails;
    if (!title || !category || !classLevel || !description) {
      toast({ title: 'Missing details', description: 'Please complete all fields.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const uploadVideoToSupabase = async (videoFile: File, registrationId: string) => {
    try {
      setUploadStatus('uploading');
      const fileExt = videoFile.name.split('.').pop() || 'mp4';
      const fileName = `${registrationId}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('story-videos').upload(fileName, videoFile);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('story-videos').getPublicUrl(fileName);
      await supabase.from('registrations').update({ yt_link: publicUrl }).eq('id', registrationId);
      setUploadStatus('complete');
      return publicUrl;
    } catch (error) {
      console.error(error);
      setUploadStatus('error');
      return null;
    }
  };

  const submitRegistration = async () => {
    setIsSubmitting(true);
    try {
      const phoneDigits = personalInfo.phone.replace(/\D/g, '');
      if (role === 'college') {
        let pdfUrl = null;
        if (storyDetails.storyPdf) {
          const fileName = `${authenticatedUserId}-${Date.now()}.pdf`;
          const { error } = await supabase.storage.from('college-story-pdfs').upload(fileName, storyDetails.storyPdf);
          if (!error) pdfUrl = supabase.storage.from('college-story-pdfs').getPublicUrl(fileName).data.publicUrl;
        }
        await supabase.from('clg_registrations').update({
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          email: personalInfo.email.toLowerCase(),
          phone: phoneDigits,
          age: parseInt(personalInfo.age),
          city: personalInfo.city,
          college_name: personalInfo.collegeName,
          degree: personalInfo.degree,
          branch: personalInfo.branch,
          story_title: storyDetails.title,
          category: storyDetails.category,
          story_description: storyDetails.description,
          pdf_url: pdfUrl,
        }).eq('unique_key', uniqueKey.toUpperCase());
      } else {
        const { data } = await supabase.from('registrations').select('id').eq('unique_key', uniqueKey.toUpperCase()).single();
        await supabase.from('registrations').update({
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
        }).eq('unique_key', uniqueKey.toUpperCase());
        if (storyDetails.videoFile && data?.id) await uploadVideoToSupabase(storyDetails.videoFile, data.id);
      }
      setIsComplete(true);
      return true;
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit.', variant: 'destructive' });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) { if (validateStep1()) setCurrentStep(2); return; }
    if (currentStep === 2) { if (await validateStep2()) { const event = events.find(e => e.id === selectedEventId); if (event?.event_type === 'school' || event?.event_type === 'college') setCurrentStep(4); else setCurrentStep(3); } return; }
    if (currentStep === 3) { if (role) setCurrentStep(4); return; }
    if (currentStep === 4) { if (validateStep3()) setCurrentStep(5); return; }
    if (currentStep === 5) { if (validateStep4()) setCurrentStep(6); return; }
    if (currentStep === 6) await submitRegistration();
  };

  const handlePrev = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  if (isComplete) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-gradient-warm">
        <div className="max-w-md w-full mx-auto p-8 text-center bg-card rounded-2xl shadow-xl border border-border">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Registration Complete!</h1>
          <p className="text-muted-foreground mb-8">You've successfully registered for the competition.</p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/dashboard')} className="flex-1">Dashboard</Button>
            <Button onClick={() => navigate('/')} variant="outline" className="flex-1">Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-warm">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Join the Competition</h1>
          <p className="text-muted-foreground">Complete your registration in {steps.length} steps</p>
        </div>

        <div className="relative mb-8 pb-10">
          <div className="flex justify-between relative z-10">
            {steps.map(s => (
              <div key={s.id} className="flex flex-col items-center">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", currentStep >= s.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  {currentStep > s.id ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className="text-[10px] sm:text-xs mt-2 font-medium">{s.title}</span>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-0">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-lg border border-border">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-center">Get Started</h2>
              {!isEventLocked && (
                <div className="space-y-2">
                  <Label>Select Event</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger><SelectValue placeholder="Select an event" /></SelectTrigger>
                    <SelectContent>{events.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              {emailStep === 'pending' ? (
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn || !selectedEventId}
                  className="w-full h-14 text-lg font-semibold bg-white text-black border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 group shadow-sm hover:shadow-md"
                >
                  {isSigningIn ? (
                    <Loader2 className="animate-spin w-6 h-6 text-primary" />
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
              ) : (
                <div className="bg-green-50 p-4 rounded-xl flex items-center gap-3 border border-green-100">
                  <Check className="text-green-600" />
                  <span className="font-medium">{verificationEmail}</span>
                  <Button onClick={() => setCurrentStep(2)} className="ml-auto">Next</Button>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-center">Verify Your Key</h2>
              <div className="space-y-2">
                <Label>Unique Key</Label>
                <Input value={uniqueKey} onChange={e => setUniqueKey(e.target.value.toUpperCase())} placeholder="Enter your key" className="h-14 text-center text-xl tracking-widest font-mono" />
              </div>
              <div className="flex gap-4">
                <Button onClick={handlePrev} variant="ghost">Back</Button>
                <Button onClick={handleNext} disabled={!uniqueKey} className="flex-1 h-12">Verify & Continue</Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-center">Select Role</h2>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setRole('school')} variant={role === 'school' ? 'default' : 'outline'} className="h-24 flex-col gap-2">
                  <School /> School
                </Button>
                <Button onClick={() => setRole('college')} variant={role === 'college' ? 'default' : 'outline'} className="h-24 flex-col gap-2">
                  <GraduationCap /> College
                </Button>
              </div>
              <div className="flex gap-4">
                <Button onClick={handlePrev} variant="ghost">Back</Button>
                <Button onClick={handleNext} disabled={!role} className="flex-1 h-12">Next</Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold">Personal Info</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input value={personalInfo.firstName} onChange={e => setPersonalInfo(p => ({ ...p, firstName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={personalInfo.lastName} onChange={e => setPersonalInfo(p => ({ ...p, lastName: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Phone Number</Label><Input value={personalInfo.phone} onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))} placeholder="+91..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Age</Label><Input type="number" value={personalInfo.age} onChange={e => setPersonalInfo(p => ({ ...p, age: e.target.value }))} /></div>
                <div className="space-y-2"><Label>City</Label><Input value={personalInfo.city} onChange={e => setPersonalInfo(p => ({ ...p, city: e.target.value }))} /></div>
              </div>
              {role === 'school' ? (
                <div className="space-y-2"><Label>School Name</Label><Input value={personalInfo.schoolName} onChange={e => setPersonalInfo(p => ({ ...p, schoolName: e.target.value }))} /></div>
              ) : (
                <div className="space-y-2"><Label>College Name</Label><Input value={personalInfo.collegeName} onChange={e => setPersonalInfo(p => ({ ...p, collegeName: e.target.value }))} /></div>
              )}
              <div className="flex gap-4">
                <Button onClick={handlePrev} variant="ghost">Back</Button>
                <Button onClick={handleNext} className="flex-1 h-12">Next</Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold">Story Details</h2>
              <div className="space-y-2"><Label>Story Title</Label><Input value={storyDetails.title} onChange={e => setStoryDetails(s => ({ ...s, title: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={storyDetails.category} onValueChange={v => setStoryDetails(s => ({ ...s, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiction">Fiction</SelectItem>
                    <SelectItem value="non-fiction">Non-Fiction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea className="w-full h-32 p-3 rounded-md border" value={storyDetails.description} onChange={e => setStoryDetails(s => ({ ...s, description: e.target.value }))} />
              </div>
              {role === 'school' ? (
                <div className="space-y-2"><Label>Upload Video</Label><Input type="file" onChange={e => setStoryDetails(s => ({ ...s, videoFile: e.target.files?.[0] || null }))} /></div>
              ) : (
                <div className="space-y-2"><Label>Upload PDF</Label><Input type="file" accept=".pdf" onChange={e => setStoryDetails(s => ({ ...s, storyPdf: e.target.files?.[0] || null }))} /></div>
              )}
              <div className="flex gap-4">
                <Button onClick={handlePrev} variant="ghost">Back</Button>
                <Button onClick={handleNext} className="flex-1 h-12">Next</Button>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-bold text-center">Review & Submit</h2>
              <div className="bg-muted p-4 rounded-xl space-y-2 text-sm italic">
                <p><strong>Event:</strong> {events.find(e => e.id === selectedEventId)?.name}</p>
                <p><strong>Role:</strong> {role} student</p>
                <p><strong>Name:</strong> {personalInfo.firstName} {personalInfo.lastName}</p>
                <p><strong>Story:</strong> {storyDetails.title}</p>
              </div>
              <div className="flex gap-4">
                <Button onClick={handlePrev} variant="ghost">Back</Button>
                <Button onClick={handleNext} disabled={isSubmitting} className="flex-1 h-12">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                  Submit Registration
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
