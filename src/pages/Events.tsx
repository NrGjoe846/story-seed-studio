import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, Trophy, Users, ArrowRight, Star, Gift, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Event {
  id: string;
  name: string;
  description: string | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  is_active: boolean;
  registration_open: boolean;
  participantCount: number;
  status: 'live' | 'upcoming' | 'ended';
}

const eventCategories = ['Live', 'All', 'Upcoming'];

const Events = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Live');

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .eq('results_announced', false)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const eventsWithStats = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

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
            registration_open: event.registration_open !== false,
            participantCount: count || 0,
            status,
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
      .channel('events-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
    
    // Apply category filter
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Live') return event.status === 'live';
    if (activeCategory === 'Upcoming') return event.status === 'upcoming';
    return true;
  });

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px]"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            All <span className="text-primary-foreground">Events</span>
          </h1>
          <p className="text-primary-foreground/90 text-lg max-w-2xl mx-auto">
            Discover all our exciting storytelling competitions and events. Register now to participate!
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Category Filters */}
          <div className="flex justify-center gap-2 mb-12">
            {eventCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'px-6 py-3 rounded-full font-medium text-sm transition-all duration-300',
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground shadow-glow'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {category === 'Live' && <Star className="w-4 h-4 inline mr-2" />}
                {category}
              </button>
            ))}
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
                <div
                  key={event.id}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Glass-morphism Card */}
                  <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
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
                              ? 'bg-red-500/90 text-white pulse-live'
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
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateRange(event.start_date, event.end_date).split(' - ')[0]}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participantCount}+ participants</span>
                          </div>
                        </div>
                        {event.registration_deadline && (
                          <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                            Registration closes: {format(new Date(event.registration_deadline), 'MMM d, yyyy h:mm a')}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        {event.registration_open ? (
                          <Link to={`/register?eventId=${event.id}`} className="flex-1">
                            <Button variant="hero" className="w-full group/btn">
                              Register Now
                              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="outline" className="flex-1 opacity-50 cursor-not-allowed" disabled>
                            Registration Closed
                          </Button>
                        )}
                        <Link to={`/voting/${event.id}`} className="flex-1">
                          <Button variant="outline" className="w-full group/btn border-primary/30 hover:bg-primary/10">
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
        </div>
      </section>
    </div>
  );
};

export default Events;
