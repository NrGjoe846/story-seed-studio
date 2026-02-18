import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Mic, Sparkles, Shield, Heart, Award, Globe, Users, Target, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CircularTestimonials } from '@/components/ui/circular-testimonials';
import logoImage from '@/assets/logo.png';

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
      name: 'Sandhiya',
      role: 'Director/COO',
      image: '/team/new-member1.jpg',
      description: 'Operational excellence is driven through strong execution, clear governance, and disciplined management of processes. Strategic plans are transformed into measurable outcomes by aligning teams, optimizing workflows, and ensuring consistency across functions. This leadership focus strengthens stability, improves efficiency, and enables scalable growth across the organization.',
    },
    {
      name: 'Nehemiah Nesanathan',
      role: 'Director/CTO ',
      image: '/team/new-member2.jpg',
      description: 'Technology vision is shaped through innovation, architecture, and system leadership. Ideas are converted into secure, scalable, and future-ready digital solutions that support business objectives. By overseeing platforms, infrastructure, and technical teams, continuous improvement and digital transformation are delivered with precision and reliability.',
    },
    {
      name: 'Eniya',
      role: 'Chief Financial Officer',
      image: '/team/new-member3.jpg',
      description: 'Financial strength is built through disciplined planning, risk management, and transparent governance. Growth is balanced with responsibility by ensuring efficient use of resources and informed decision-making. Strategic financial oversight supports long-term value creation and organizational sustainability.',
    },
    {
      name: 'Kishore',
      role: 'Production Manager ',
      image: '/team/new-member4.jpg',
      description: 'Experiences are brought to life through end-to-end planning, coordination, and execution. Concepts are transformed into impactful and well-managed events by combining creativity with operational control. Attention to detail, timeline management, and quality delivery ensure consistent and memorable outcomes.',
    },
    {
      name: 'Anjali Patel',
      role: 'Human Resource Officer',
      image: '/team/new-member5.jpg',
      description: 'People and culture are shaped through purposeful leadership and talent development. High-performing teams are built by fostering engagement, capability, and alignment with organizational goals. A strong, inclusive workplace culture is created where individuals grow, perform, and contribute meaningfully to success.',
    },
    {
      name: 'Akash Kumar Singh',
      role: 'Full Stack Developer',
      image: '/team/new-member6.jpg',
      description: 'End-to-end solutions are built by combining strong front-end design with robust back-end architecture. User experiences are crafted with clarity, performance, and usability, while systems are engineered for scalability, security, and reliability. From databases to interfaces, ideas are transformed into complete, production-ready applications that drive real-world impact.',
    },
    {
      name: 'Madhan Kumar',
      role: 'Frontend UX/UI desgin ',
      image: '/team/new-member7.jpg',
      description: 'Digital experiences are shaped through intuitive layouts, clean visuals, and user-focused design. Interfaces are crafted to be simple, accessible, and visually engaging while ensuring smooth interaction across devices. By blending creativity with usability, designs guide users effortlessly and turn ideas into meaningful digital experiences.',
    },
    {
      name: 'Kamlesh',
      role: 'Backend & Automation',
      image: '/team/new-member8.jpg',
      description: 'Reliable systems are built by automating backend processes to run efficiently and consistently. Data handling, integrations, and workflows are designed to operate seamlessly in the background, reducing manual effort and errors. Through structured logic and scalable architecture, automation ensures speed, accuracy, and smooth system performance.',
    },
    {
      name: 'Mohammed Tanveer',
      role: 'Frontend UX/UI desgin ',
      image: '/team/new-member9.jpg',
      description: 'Digital experiences are shaped through intuitive layouts, clean visuals, and user-focused design. Interfaces are crafted to be simple, accessible, and visually engaging while ensuring smooth interaction across devices. By blending creativity with usability, designs guide users effortlessly and turn ideas into meaningful digital experiences.',
    },
  ];

  return (
    <div className="page-enter">
      {/* Hero Section with Gradient */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-br from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] overflow-hidden">
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:40px_40px]"></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg">
              About Us
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
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
                    src="/about-hero.jpg"
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
                 Story Seeds is a creative storytelling platform dedicated to nurturing children’s imagination, confidence, and communication skills. We believe every child is born with a spark of curiosity and creativity, and our mission is to give that spark a stage to shine. More than just a fun activity, storytelling at Story Seeds is a powerful developmental tool that helps shape a child’s thinking, emotional growth, and self-expression, providing them with the encouragement and space to share the rich inner worlds of ideas, feelings, and dreams they carry within.
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
                    src={logoImage}
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
                    src="/ss.mp4"
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

      {/* Team Section - HIDDEN (remove 'hidden' class to show) */}
      <section className="hidden py-12 sm:py-16 bg-gradient-to-br from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:40px_40px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 drop-shadow-lg">
                Let's Meet Our Team
              </h2>
              <p className="text-sm sm:text-base text-white/90 max-w-2xl mx-auto drop-shadow-md">
                Our team consists only of the best talents
              </p>
            </div>

            <div className="flex justify-center items-center">
              <CircularTestimonials
                testimonials={team.map(member => ({
                  quote: member.description,
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
                <Link to="/events">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#9B1B1B] via-[#FF6B35] to-[#D4AF37] hover:opacity-90">
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
