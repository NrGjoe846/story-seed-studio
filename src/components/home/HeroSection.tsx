import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Event {
  id: string;
  name: string;
  description: string | null;
  banner_image: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'live' | 'upcoming' | 'ended';
}

export const HeroSection = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data: eventsData, error } = await supabase
          .from('events')
          .select('*')
          .eq('is_active', true)
          .eq('results_announced', false)
          .order('start_date', { ascending: true });

        if (error) throw error;

        const now = new Date();
        const eventsWithStatus = (eventsData || []).map((event) => {
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
            status,
          };
        });

        setEvents(eventsWithStatus);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    const channel = supabase
      .channel('hero-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || events.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % events.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, events.length]);

  const nextSlide = () => {
    if (events.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % events.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    if (events.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + events.length) % events.length);
    setIsAutoPlaying(false);
  };

  if (loading) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
            Welcome to <span className="text-gradient">Story Seed Studio</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Check back soon for exciting events!
          </p>
        </div>
      </section>
    );
  }

  const currentEvent = events[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-[140px] md:pt-[120px] pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-left order-2 lg:order-1">
            <div key={currentSlide} className="animate-fade-in">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-foreground">
                <span>{currentEvent.name}</span>
              </h1>
            </div>
            <p
              key={`desc-${currentSlide}`}
              className="text-lg md:text-xl text-muted-foreground max-w-xl animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              {currentEvent.description || 'Join this exciting storytelling competition!'}
            </p>
            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <Link to={`/register?eventId=${currentEvent.id}`}>
                <Button variant="hero" size="xl" className="shadow-xl">
                  Register Now
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-primary/30 text-foreground hover:bg-primary/10 shadow-lg"
                >
                  View All Events
                </Button>
              </Link>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-2 pt-4">
              {events.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setIsAutoPlaying(false);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentSlide
                      ? 'w-8 bg-primary shadow-lg'
                      : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Slider */}
          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className={cn(
                    'absolute inset-0 transition-all duration-700 ease-in-out',
                    index === currentSlide
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                  )}
                >
                  <img
                    src={event.banner_image || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* Navigation Arrows */}
              {events.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-background hover:scale-110 transition-all"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-background hover:scale-110 transition-all"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                </>
              )}
            </div>

            {/* Decorative frame */}
            <div className="absolute -inset-4 border-2 border-primary/20 rounded-3xl -z-10" />
            <div className="absolute -inset-8 border border-gold/10 rounded-[2rem] -z-20" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-bounce">
          <button
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight,
                behavior: 'smooth'
              });
            }}
            className="p-2 rounded-full bg-background/50 backdrop-blur-sm border border-border/50 hover:bg-background/80 transition-colors shadow-lg group"
            aria-label="Scroll down"
          >
            <ChevronsDown className="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors" />
          </button>
        </div>
      </div>
    </section >
  );
};
