import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, CreditCard, ArrowRight, Loader2, QrCode, Smartphone } from 'lucide-react';
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
  
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr'>('upi');
  const [transactionId, setTransactionId] = useState('');
  const [senderName, setSenderName] = useState('');

  useEffect(() => {
    const checkAuthAndFetchEvent = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Login Required',
          description: 'Please log in to participate in events.',
          variant: 'destructive',
        });
        navigate('/user');
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
      setLoading(false);
    };

    checkAuthAndFetchEvent();
  }, [eventId, navigate, toast]);

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
    const uniqueKey = generateUniqueKey();

    try {
      // Determine which table to use based on event_type (default to registrations if both)
      // For now, let's create a stub in BOTH if it's 'both', or specific if otherwise.
      // Actually, it's better to just use 'registrations' as the primary for payment stubs.
      const tableName = event.event_type === 'college' ? 'clg_registrations' : 'registrations';

      const { error } = await supabase
        .from(tableName)
        .insert({
          user_id: user.id,
          event_id: eventId,
          payment_status: 'paid',
          unique_key: uniqueKey,
          payment_details: {
            transaction_id: transactionId,
            sender_name: senderName,
            method: paymentMethod,
            timestamp: new Date().toISOString(),
          },
          // We need some placeholder values for mandatory fields if any
          first_name: senderName.split(' ')[0] || 'User',
          last_name: senderName.split(' ')[1] || '',
          email: user.email,
        });

      if (error) throw error;

      toast({
        title: 'Payment Recorded!',
        description: `Your unique key is: ${uniqueKey}. Please use this to complete registration.`,
      });

      // Redirect to registration with eventId and pre-filled key
      navigate(`/register?eventId=${eventId}&key=${uniqueKey}`);
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
          <h1 className="text-4xl font-display font-bold mb-4">Event <span className="text-gradient">Payment</span></h1>
          <p className="text-muted-foreground text-lg">Participate in {event.name}</p>
        </div>

        <div className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="space-y-8">
            {/* Payment Method Toggle */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('upi')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'upi' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="font-semibold">UPI App</span>
              </button>
              <button
                onClick={() => setPaymentMethod('qr')}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 'qr' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <QrCode className="w-6 h-6" />
                <span className="font-semibold">Scan & Pay</span>
              </button>
            </div>

            {paymentMethod === 'qr' && event.qr_code_url && (
              <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl animate-fade-in">
                <img src={event.qr_code_url} alt="Payment QR" className="w-48 h-48 object-contain" />
                <p className="text-sm font-medium text-black">Scan this QR code to pay</p>
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

            <Button
              className="w-full h-14 bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white text-lg font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
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
      </div>
    </div>
  );
};

export default PaymentPortal;
