import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, ArrowRight, Star, TrendingUp, Clock, Vote, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  participantCount: number;
  status: 'live' | 'upcoming' | 'ended';
  userStatus?: 'none' | 'paid' | 'registered';
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
              if (existingReg.story_title) userStatus = 'registered';
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
            registration_open: event.registration_open !== false,
            participantCount: count || 0,
            status,
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

    const channel = supabase
      .channel('home-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
              <div
                key={event.id}
                className="group relative animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Glass-morphism Card */}
                <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                  {/* Background Image with Overlay */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={event.banner_image || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'}
                      alt={event.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-4 left-4">
                      <span
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm',
                          event.status === 'live'
                            ? 'bg-red-500/90 text-white'
                            : event.status === 'upcoming'
                              ? 'bg-blue-500/90 text-white'
                              : 'bg-gray-500/90 text-white'
                        )}
                      >
                        {event.status === 'live' ? '🔴 Live Now' : event.status === 'upcoming' ? 'Coming Soon' : 'Ended'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                    <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {event.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {event.description || 'Join this exciting storytelling competition!'}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateRange(event.start_date, event.end_date).split(' - ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{event.participantCount}+ participants</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      {event.userStatus === 'registered' ? (
                        <Button variant="outline" className="flex-1 bg-green-50 text-green-600 border-green-200 cursor-default hover:bg-green-50">
                          <Check className="w-4 h-4 mr-2" /> Registered
                        </Button>
                      ) : event.userStatus === 'paid' ? (
                        <Link to={`/register?eventId=${event.id}`} className="flex-1">
                          <Button variant="hero" className="w-full group bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90">
                            Complete Registration
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      ) : event.registration_open ? (
                        <Link to={`/pay-event/${event.id}`} className="flex-1">
                          <Button variant="hero" className="w-full group bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] hover:opacity-90">
                            Participate & Pay
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" className="flex-1 opacity-50 cursor-not-allowed" disabled>
                          Registration Closed
                        </Button>
                      )}
                      <Link to={`/voting/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full group bg-white text-[#9B1B1B] hover:bg-[#9B1B1B] hover:text-white border-2 border-[#9B1B1B] transition-all duration-300 font-semibold">
                          <Vote className="w-4 h-4 mr-2" />
                          Vote
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
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
