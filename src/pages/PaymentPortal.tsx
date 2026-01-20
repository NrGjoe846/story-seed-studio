import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Smartphone, QrCode, ArrowRight, Loader2, Check, School, GraduationCap, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const generateUniqueKey = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const PaymentPortal = () => {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Personal, 2: Payment, 3: Success
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    age: '',
    city: '',
    schoolName: '',
    collegeName: '',
    role: null as 'school' | 'college' | null
  });

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr'>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Login Required',
          description: 'Please log in to participate in events.',
          variant: 'destructive',
        });
        navigate(`/user?redirect=/pay-event/${eventId}`);
        return;
      }
      setUser(session.user);

      if (!eventId) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error || !data) {
        toast({
          title: 'Error',
          description: 'Event not found.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }
      setEvent(data);

      // Auto-set role if fixed
      if (data.event_type === 'school') {
        setPersonalInfo(prev => ({ ...prev, role: 'school' }));
      } else if (data.event_type === 'college') {
        setPersonalInfo(prev => ({ ...prev, role: 'college' }));
      }

      setLoading(false);
    };

    checkAuthAndFetchEvent();
  }, [eventId, navigate, toast]);

  const validatePersonalStep = () => {
    const { firstName, lastName, phone, age, city, role } = personalInfo;
    if (!firstName || !lastName || !phone || !age || !city || !role) {
      toast({
        title: 'Missing Information',
        description: 'Please fill all personal details and select your role.',
        variant: 'destructive',
      });
      return false;
    }

    if (role === 'school' && !personalInfo.schoolName) {
      toast({ title: 'School Name Required', variant: 'destructive' });
      return false;
    }
    if (role === 'college' && !personalInfo.collegeName) {
      toast({ title: 'College Name Required', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!transactionId || !senderName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter transaction ID and sender name.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const key = generateUniqueKey();

    try {
      const tableName: 'registrations' | 'clg_registrations' =
        personalInfo.role === 'college' ? 'clg_registrations' : 'registrations';

      const payload: any = {
        user_id: user.id,
        event_id: eventId,
        payment_status: 'paid',
        unique_key: key,
        payment_details: {
          transaction_id: transactionId,
          sender_name: senderName,
          method: paymentMethod,
          timestamp: new Date().toISOString(),
        },
        first_name: personalInfo.firstName,
        last_name: personalInfo.lastName,
        email: user.email,
        phone: personalInfo.phone,
        age: parseInt(personalInfo.age),
        city: personalInfo.city,
        story_title: null,
        category: null,
        story_description: null,
      };

      if (personalInfo.role === 'school') {
        payload.class_level = null;
      } else {
        payload.college_name = personalInfo.collegeName;
      }

      const { error } = await supabase
        .from(tableName)
        .insert(payload);

      if (error) throw error;

      setUniqueKey(key);
      setStep(3); // Go to success step

      toast({
        title: 'Payment Recorded!',
        description: `Your unique key is: ${key}.`,
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Error',
        description: error.message || 'Could not record payment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold mb-4">Event <span className="text-gradient">Participation</span></h1>
          <p className="text-muted-foreground text-lg">
            {step === 1 ? 'Step 1: Personal Details' : step === 2 ? 'Step 2: Payment' : 'Step 3: Registration Key'}
          </p>
          <p className="text-primary font-medium">{event.name}</p>
        </div>

        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={personalInfo.firstName}
                    onChange={e => setPersonalInfo(p => ({ ...p, firstName: e.target.value }))}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={personalInfo.lastName}
                    onChange={e => setPersonalInfo(p => ({ ...p, lastName: e.target.value }))}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={personalInfo.phone}
                  onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={personalInfo.age}
                    onChange={e => setPersonalInfo(p => ({ ...p, age: e.target.value }))}
                    placeholder="18"
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={personalInfo.city}
                    onChange={e => setPersonalInfo(p => ({ ...p, city: e.target.value }))}
                    placeholder="Bangalore"
                  />
                </div>
              </div>

              {event.event_type === 'both' && (
                <div className="space-y-2">
                  <Label>Select Category</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setPersonalInfo(p => ({ ...p, role: 'school' }))}
                      variant={personalInfo.role === 'school' ? 'default' : 'outline'}
                      className="h-12"
                    >
                      <School className="mr-2 h-4 w-4" /> School
                    </Button>
                    <Button
                      onClick={() => setPersonalInfo(p => ({ ...p, role: 'college' }))}
                      variant={personalInfo.role === 'college' ? 'default' : 'outline'}
                      className="h-12"
                    >
                      <GraduationCap className="mr-2 h-4 w-4" /> College
                    </Button>
                  </div>
                </div>
              )}

              {personalInfo.role === 'school' && (
                <div className="space-y-2">
                  <Label>School Name</Label>
                  <Input
                    value={personalInfo.schoolName}
                    onChange={e => setPersonalInfo(p => ({ ...p, schoolName: e.target.value }))}
                    placeholder="Enter school name"
                  />
                </div>
              )}

              {personalInfo.role === 'college' && (
                <div className="space-y-2">
                  <Label>College Name</Label>
                  <Input
                    value={personalInfo.collegeName}
                    onChange={e => setPersonalInfo(p => ({ ...p, collegeName: e.target.value }))}
                    placeholder="Enter college name"
                  />
                </div>
              )}

              <Button
                onClick={() => { if (validatePersonalStep()) setStep(2); }}
                className="w-full h-14 bg-primary text-white text-lg font-bold rounded-2xl"
              >
                Continue to Payment
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'upi' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="font-semibold">UPI App</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('qr')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'qr' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <QrCode className="w-6 h-6" />
                  <span className="font-semibold">Scan & Pay</span>
                </button>
              </div>

              {paymentMethod === 'qr' && event.qr_code_url && (
                <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl animate-fade-in text-center">
                  <img src={event.qr_code_url} alt="Payment QR" className="w-48 h-48 object-contain" />
                  <p className="text-sm font-medium text-black">Scan this QR code to pay Rs. {event.registration_fee || '100'}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Sender Name (as in bank)</Label>
                  <Input
                    id="senderName"
                    placeholder="Enter name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID / UTR Number</Label>
                  <Input
                    id="transactionId"
                    placeholder="Enter 12-digit ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="h-14 px-6">Back</Button>
                <Button
                  className="flex-1 h-14 bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                  onClick={handlePayment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      Confirm Payment & Get Key
                      <ArrowRight className="w-6 h-6 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in zoom-in-95 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-muted-foreground">Your transaction has been recorded and is pending verification.</p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 space-y-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Unique Registration Key</p>
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl font-mono font-bold text-primary tracking-widest select-all">
                    {uniqueKey}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 hover:bg-primary/5"
                    onClick={() => {
                      navigator.clipboard.writeText(uniqueKey);
                      toast({ title: 'Key Copied!', description: 'Unique key copied to clipboard.' });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Key
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Please save this key safely. You will need it to submit your story once registration opens.</p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full h-14 bg-primary text-white text-lg font-bold rounded-2xl"
                >
                  Go to Dashboard
                </Button>
                <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground">
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPortal;
