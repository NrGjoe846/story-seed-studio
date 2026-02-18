import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Trophy, Star, School, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { EventCard } from '@/components/events/EventCard';

interface Event {
  id: string;
  name: string;
  description: string | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  registration_open: boolean;
  is_payment_enabled: boolean;
  payment_deadline: string | null;
  registration_start_date: string | null;
  registration_fee: number | null;
  participantCount: number;
  status: 'live' | 'upcoming' | 'ended';
  event_type: 'school' | 'college' | 'both';
  userStatus?: 'none' | 'paid' | 'registered';
}

const eventCategories = ['Live', 'All', 'Upcoming'];

const Events = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Live');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'school' | 'college'>('all');

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
            registration_deadline: event.registration_deadline,
            is_active: event.is_active,
            is_payment_enabled: event.is_payment_enabled !== false,
            registration_open: event.registration_open === true,
            payment_deadline: event.payment_deadline,
            registration_start_date: event.registration_start_date,
            registration_fee: event.registration_fee,
            participantCount: count || 0,
            status,
            event_type: (event as any).event_type || 'both',
            userStatus,
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
      .channel('events-realtime')
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

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return 'TBD';
    const startDate = format(new Date(start), 'MMM d, yyyy');
    if (end) {
      const endDate = format(new Date(end), 'MMM d, yyyy');
      return `${startDate} - ${endDate}`;
    }
    return startDate;
  };

  const filteredEvents = events.filter((event) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        event.name.toLowerCase().includes(query) ||
        (event.description && event.description.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      if (event.event_type !== eventTypeFilter && event.event_type !== 'both') {
        return false;
      }
    }

    // Apply category filter
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Live') return event.status === 'live';
    if (activeCategory === 'Upcoming') return event.status === 'upcoming';
    return true;
  });

  return (
    <div className="page-enter">
      {/* Hero Banner */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] overflow-hidden">
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:40px_40px]"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            All <span className="text-[#D4AF37]">Events</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            Discover all our exciting storytelling competitions and events. Register now to participate!
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Filters Container */}
          <div className="flex flex-col items-center justify-center gap-6 mb-12">
            <div className="flex-1 flex flex-col items-center w-full max-w-3xl">
              {/* Event Type Toggle */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex p-1.5 bg-card border border-border rounded-full shadow-sm">
                  <button
                    onClick={() => setEventTypeFilter('all')}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300',
                      eventTypeFilter === 'all'
                        ? 'bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    All Events
                  </button>
                  <button
                    onClick={() => setEventTypeFilter('school')}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
                      eventTypeFilter === 'school'
                        ? 'bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <School className="w-4 h-4" />
                    School
                  </button>
                  <button
                    onClick={() => setEventTypeFilter('college')}
                    className={cn(
                      'px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
                      eventTypeFilter === 'college'
                        ? 'bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] text-white shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <GraduationCap className="w-4 h-4" />
                    College
                  </button>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap justify-center gap-2">
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
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No events available in this category. Check back soon!</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event, index) => (
                <EventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Events;
