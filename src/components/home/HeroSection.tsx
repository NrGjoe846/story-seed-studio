import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedBlobCard from './AnimatedBlobCard';

interface LeaderQuote {
  id: number;
  name: string;
  title: string;
  image: string;
  quote: string;
}

const leaderQuotes: LeaderQuote[] = [
  {
    id: 1,
    name: 'C. Subramania Bharati',
    title: 'Poet & Freedom Fighter',
    image: '/assets/bhagat-singh.jpg',
    quote: 'A Brave Heart and a Bright Mind Can Change the World.'
  },
  {
    id: 2,
    name: 'Dr. APJ Abdul Kalam',
    title: 'Scientist & Former President of India',
    image: '/assets/apj-kalam.jpg',
    quote: 'Every dream begins as a story and every story deserves a voice.'
  },
  {
    id: 3,
    name: 'Albert Einstein',
    title: 'Theoretical Physicist',
    image: '/assets/einstein.jpg',
    quote: 'Imagination is more important than knowledge.'
  }
];

export const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % leaderQuotes.length);
    }, 6000); // Change slide every 6 seconds

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % leaderQuotes.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + leaderQuotes.length) % leaderQuotes.length);
    setIsAutoPlaying(false);
  };

  const currentQuote = leaderQuotes[currentSlide];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-cream">
      {/* Abstract Background - Red to Yellow Gradient Waves */}
      {/* Added top-24 to avoid Navbar overlap */}
      <div className="absolute inset-0 top-24 z-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="redYellowGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(0, 72%, 36%)" />
              <stop offset="100%" stopColor="hsl(45, 93%, 47%)" />
            </linearGradient>
            <linearGradient id="redYellowGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(45, 93%, 47%)" />
              <stop offset="100%" stopColor="hsl(0, 72%, 36%)" />
            </linearGradient>
          </defs>
          {/* Top Right Curve - Pushed further corner to avoid center/card */}
          <path
            d="M1440 0V450C1300 400 1200 100 1000 0H1440Z"
            fill="url(#redYellowGradient1)"
            opacity="0.9"
          />
          <path
            d="M1440 0V550C1250 500 1100 100 900 0H1440Z"
            fill="url(#redYellowGradient2)"
            opacity="0.5"
          />

          {/* Bottom Swoosh - Flattened to stay low */}
          <path
            d="M0 900H1440V650C1100 800 800 750 400 880L0 900Z"
            fill="url(#redYellowGradient2)"
            opacity="0.8"
          />
          <path
            d="M0 900H1440V550C1100 700 700 650 200 900L0 900Z"
            fill="url(#redYellowGradient1)"
            opacity="0.4"
          />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-20 pt-[140px] md:pt-[120px] pb-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content - Quote */}
          <div className="space-y-8 text-left order-2 lg:order-1">
            <div key={currentSlide} className="animate-fade-in">
              {/* Quote Icon */}
              <Quote className="w-16 h-16 text-primary/20 mb-6" />

              {/* Quote Text */}
              <blockquote className="space-y-6">
                <p className="font-display text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed text-foreground italic">
                  "{currentQuote.quote}"
                </p>

                {/* Author Info */}
                <footer className="space-y-2">
                  <cite className="not-italic">
                    <div className="font-display text-xl md:text-2xl font-semibold text-primary">
                      — {currentQuote.name}
                    </div>
                    <div className="text-base md:text-lg text-muted-foreground">
                      {currentQuote.title}
                    </div>
                  </cite>
                </footer>
              </blockquote>
            </div>

            {/* Dots Indicator */}
            <div className="flex gap-3 pt-4">
              {leaderQuotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setIsAutoPlaying(false);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    index === currentSlide
                      ? 'w-12 bg-primary shadow-lg'
                      : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Slider - Leader Images */}
          <div className="relative order-1 lg:order-2">
            <AnimatedBlobCard className="max-w-md mx-auto aspect-square">
              {leaderQuotes.map((leader, index) => (
                <div
                  key={leader.id}
                  className={cn(
                    'absolute inset-0 transition-all duration-700 ease-in-out',
                    index === currentSlide
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 scale-105'
                  )}
                >
                  <img
                    src={leader.image}
                    alt={leader.name}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Name Badge at Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-white">
                      {leader.name}
                    </h3>
                    <p className="text-sm md:text-base text-white/80">
                      {leader.title}
                    </p>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              {leaderQuotes.length > 1 && (
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
            </AnimatedBlobCard>
          </div>
        </div>
      </div>
    </section>
  );
};
