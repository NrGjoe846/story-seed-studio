import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Mic, Sparkles, Shield, Heart, Award, Globe, Users, Target, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';

const About = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'vision' | 'values'>('mission');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlayVideo = () => {
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const missionPoints = [
    {
      icon: Mic,
      title: 'Empower Every Child\'s Voice',
      description: 'Help children express themselves confidently through storytelling, improving communication and emotional awareness.',
    },
    {
      icon: Sparkles,
      title: 'Spark Imagination and Creativity',
      description: 'Provide inspiring topics, fun challenges, and creative themes that unlock a child\'s imagination.',
    },
    {
      icon: Shield,
      title: 'Build a Safe & Joyful Learning Space',
      description: 'Create a secure digital environment where parents can upload storytelling videos and preserve childhood memories.',
    },
    {
      icon: BookOpen,
      title: 'Encourage Learning Through Fun',
      description: 'Blend education with entertainment (Edutainment) and make learning a joyful experience.',
    },
    {
      icon: Award,
      title: 'Celebrate Talent Through Recognition',
      description: 'Recognize and reward children\'s creativity through the Little Voices Awards.',
    },
    {
      icon: Globe,
      title: 'Connect a Global Community',
      description: 'Bring children, parents, educators, and creators together on a shared platform.',
    },
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'Founder & CEO',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    },
    {
      name: 'Michael Chen',
      role: 'Creative Director',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    {
      name: 'Jessica Williams',
      role: 'Head of Content',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    },
    {
      name: 'David Wilson',
      role: 'Lead Developer',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    },
    {
      name: 'Emily Brown',
      role: 'UX Designer',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    },
    {
      name: 'James Taylor',
      role: 'Marketing Manager',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    },
    {
      name: 'Linda Martinez',
      role: 'Content Writer',
      image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop',
    },
    {
      name: 'Robert Anderson',
      role: 'Community Manager',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
    {
      name: 'Patricia Thomas',
      role: 'Product Owner',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    },
    {
      name: 'Christopher Garcia',
      role: 'Education Specialist',
      image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
    },
  ];

  return (
    <div className="page-enter">
      {/* Hero Section with Gradient */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground">
              About Us
            </h1>
            <p className="text-base sm:text-lg text-primary-foreground/90 max-w-2xl mx-auto">
              Read more about us. Our vision, mission, success and many other things you might love.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Section with Tabs */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 items-start">
              {/* Left Side - Image */}
              <div className="space-y-5 sm:space-y-6 flex flex-col items-center">
                <div className="relative aspect-square w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <img
                    src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=600&fit=crop"
                    alt="Story Seeds"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side - Heading and Intro */}
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                  We help on creating storytelling platform
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Story Seeds is a one-of-a-kind creative storytelling platform built to nurture the imagination, confidence, and communication skills of young children. We believe every child is born with a spark — a spark of curiosity, creativity, and the desire to express what they see, feel, and dream. Our goal is to give that spark a stage.
                  <br />
                  <br />
                  At Story Seeds, we see storytelling as more than just a fun activity — it is a powerful developmental tool that shapes a child’s thinking, confidence, and emotional growth. Every child carries within them an unexplored world of ideas, feelings, and imaginations waiting to be discovered and shared. Yet, in the rush of everyday life, children rarely get the opportunity or encouragement to express these inner worlds.
                </p>
              </div>
            </div>

            {/* Tabs and Tab Content below heading */}
            <div className="mt-10 space-y-5 text-center max-w-5xl mx-auto">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setActiveTab('mission')}
                  className={cn(
                    'px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all',
                    activeTab === 'mission'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Mission
                </button>
                <button
                  onClick={() => setActiveTab('vision')}
                  className={cn(
                    'px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all',
                    activeTab === 'vision'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Vision
                </button>
                <button
                  onClick={() => setActiveTab('values')}
                  className={cn(
                    'px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all',
                    activeTab === 'values'
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  Our Value
                </button>
              </div>

              <div className="space-y-3 text-muted-foreground leading-relaxed text-sm sm:text-base text-center">
                {activeTab === 'mission' && (
                  <div className="space-y-3">
                    <p>
                      In today's fast-moving world, children spend more time consuming content than creating it. Story Seeds changes that. We encourage children to speak, imagine, narrate, explore ideas, and find their own voice. With guided topics, interactive prompts, story themes, and monthly challenges, children learn to think freely, communicate clearly, and develop self-confidence from an early age.
                    </p>
                    <p>
                      Parents play a major role in this journey. Story Seeds provides a safe, secure, and joyful space where parents can record and upload their children's storytelling videos. These videos become priceless memories — a treasure of childhood moments that families can watch for years.
                    </p>
                  </div>
                )}
                {activeTab === 'vision' && (
                  <p>
                    To become the world's leading creative space where every child discovers the power of their voice, imagination, and storytelling. We envision millions of children developing confidence, communication skills, and leadership qualities through the simple joy of telling a story. Story Seeds aims to grow into a global family where creativity is valued, imagination is celebrated, and every child is given a platform to shine.
                  </p>
                )}
                {activeTab === 'values' && (
                  <p>
                    Story Seeds is built with love, passion, and dedication by a team of educators, content creators, designers, and child-development supporters. Together, we are building a global community where children can connect, express, and grow. We celebrate young creativity through the Little Voices Awards, honoring children for their storytelling talent, imagination, clarity, expression, and courage.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 text-center">
              Take A Vital Look At Our Application working
            </h2>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base text-center max-w-3xl mx-auto">
              By accessing and using the Story Seeds platform, you agree to be bound by these Terms of Service.
            </p>
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black group">
              {!isVideoPlaying ? (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=675&fit=crop"
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
                  <button
                    onClick={handlePlayVideo}
                    className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary rounded-full flex items-center justify-center shadow-2xl">
                      <Play className="w-10 h-10 sm:w-12 sm:h-12 text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </button>
                </>
              ) : (
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="w-full h-full"
                  onEnded={() => setIsVideoPlaying(false)}
                >
                  <source
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Points Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-8 sm:mb-10 text-center">
              Our Mission
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {missionPoints.map((point, index) => {
                const IconComponent = point.icon;
                return (
                  <div
                    key={index}
                    className="bg-card rounded-xl sm:rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-2">
                          {point.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-16 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground mb-3">
                Let's Meet Our Team
              </h2>
              <p className="text-sm sm:text-base text-primary-foreground/80 max-w-2xl mx-auto">
                Our team consists only of the best talents
              </p>
            </div>

            <div className="flex justify-center items-center">
              <CircularTestimonials
                testimonials={team.map(member => ({
                  quote: "Dedicated to nurturing creativity and storytelling in every child.",
                  name: member.name,
                  designation: member.role,
                  src: member.image
                }))}
                autoplay={true}
                colors={{
                  name: "#ffffff",
                  designation: "#e2e8f0",
                  testimony: "#f8fafc",
                  arrowBackground: "#ffffff",
                  arrowForeground: "#ef4444",
                  arrowHoverBackground: "#f1f5f9",
                }}
                fontSizes={{
                  name: "1.5rem",
                  designation: "1rem",
                  quote: "1.125rem",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
              <div className="md:col-span-2 space-y-3">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  The future of creative storytelling
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                  Join our growing community of young storytellers, parents, and educators. Together, we're creating a world where every child's voice is heard and celebrated.
                </p>
              </div>
              <div className="flex justify-center md:col-span-2">
                <Link to="/user">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
