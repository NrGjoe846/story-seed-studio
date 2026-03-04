import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { EventCard } from '../events/EventCard';

const eventCategories = ['Live', 'All', 'Upcoming'];

interface Event {
  id: string;
  name: string;
  description: string | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  registration_open: boolean;
  is_payment_enabled: boolean;
  payment_deadline: string | null;
  registration_start_date: string | null;
  registration_deadline: string | null;
  registration_fee: number | null;
  participantCount: number;
  status: 'live' | 'upcoming' | 'ended';
  userStatus?: 'none' | 'paid' | 'registered';
  submission_mode?: 'individual' | 'institutional';
}

export const EventsSection = () => {
  const [activeCategory, setActiveCategory] = useState('Live');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('results_announced', false)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          // Check if user has already paid/registered
          let userStatus: 'none' | 'paid' | 'registered' = 'none';
          if (currentUserId) {
            const { data: reg } = await supabase
              .from('registrations')
              .select('payment_status, story_title')
              .eq('event_id', event.id)
              .eq('user_id', currentUserId)
              .maybeSingle();

            const { data: clgReg } = await supabase
              .from('clg_registrations')
              .select('payment_status, story_title')
              .eq('event_id', event.id)
              .eq('user_id', currentUserId)
              .maybeSingle();

            const existingReg = reg || clgReg;
            if (existingReg) {
              if (existingReg.story_title && existingReg.story_title !== 'Pending Registration') userStatus = 'registered';
              else if (existingReg.payment_status === 'paid') userStatus = 'paid';
            }
          }

          const now = new Date();
          const start = event.start_date ? new Date(event.start_date) : null;
          const end = event.end_date ? new Date(event.end_date) : null;

          let status: 'live' | 'upcoming' | 'ended' = 'upcoming';
          if (start && now < start) status = 'upcoming';
          else if (end && now > end) status = 'ended';
          else status = 'live';

          return {
            id: event.id,
            name: event.name,
            description: event.description,
            banner_image: event.banner_image,
            start_date: event.start_date,
            end_date: event.end_date,
            is_active: event.is_active,
            is_payment_enabled: event.is_payment_enabled !== false,
            registration_open: event.registration_open === true,
            payment_deadline: event.payment_deadline,
            registration_start_date: event.registration_start_date,
            registration_deadline: event.registration_deadline,
            registration_fee: event.registration_fee,
            participantCount: count || 0,
            status,
            userStatus,
            submission_mode: (event as any).submission_mode || 'individual',
          };
        })
      );

      setEvents(eventsWithStats);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Listen for events, registrations, and session changes
    const eventsChannel = supabase
      .channel('home-events-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clg_registrations' }, () => fetchEvents())
      .subscribe();

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      fetchEvents();
    });

    return () => {
      supabase.removeChannel(eventsChannel);
      authSubscription.unsubscribe();
    };
  }, []);

  const filteredEvents = events.filter((event) => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Live') return event.status === 'live';
    if (activeCategory === 'Upcoming') return event.status === 'upcoming';
    return true;
  });

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return 'TBD';
    const startDate = format(new Date(start), 'MMM d, yyyy');
    if (end) {
      const endDate = format(new Date(end), 'MMM d, yyyy');
      return `${startDate} - ${endDate}`;
    }
    return startDate;
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header Content */}
        <div className="text-center space-y-4 mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Upcoming <span className="text-gradient">Events</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Don't miss out on these exciting storytelling competitions and events
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center gap-2 mb-12">
          {eventCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                'px-6 py-3 rounded-full font-medium text-sm transition-all duration-300',
                activeCategory === category
                  ? 'bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {category === 'Live' && <Star className="w-4 h-4 inline mr-2" />}
              {category === 'All' && <TrendingUp className="w-4 h-4 inline mr-2" />}
              {category === 'Upcoming' && <Clock className="w-4 h-4 inline mr-2" />}
              {category}
            </button>
          ))}
        </div>

        {/* Events Grid with Glass-morphism */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No events found in this category.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.slice(0, 6).map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}

        {/* View All */}
        <div className="text-center mt-12">
          <Link to="/events">
            <Button variant="outline" size="lg" className="bg-white text-[#9B1B1B] hover:bg-[#9B1B1B] hover:text-white border-2 border-[#9B1B1B] transition-all duration-300 font-semibold">
              View All Events
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
