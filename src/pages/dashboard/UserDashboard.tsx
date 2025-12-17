import { useState, useEffect } from 'react';
import { Calendar, Trophy, FileText, ArrowRight, Loader2, Eye, TrendingUp, Mail, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RegistrationsModal } from '@/components/dashboard/RegistrationsModal';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Registration {
  id: string;
  story_title: string;
  category: string;
  created_at: string;
  event_id: string | null;
  overall_votes: number;
  overall_views: number;
  events?: { name: string } | null;
}

interface UserStats {
  totalSubmissions: number;
  totalVotes: number;
  totalViews: number;
  rank: number;
  registeredEvents: number;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    totalVotes: 0,
    totalViews: 0,
    rank: 0,
    registeredEvents: 0,
  });
  const [submissions, setSubmissions] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchUserData = async (email: string) => {
      try {
        // Fetch all registrations and filter by email
        const { data: allRegistrations, error: regError } = await supabase
          .from('registrations')
          .select('id, story_title, category, created_at, event_id, overall_votes, overall_views, email, first_name, events:events!registrations_event_id_fkey(name)')
          .eq('email', email)
          .order('created_at', { ascending: false });

        if (regError) {
          console.error('Error fetching registrations:', regError);
          setIsLoading(false);
          return;
        }

        const registrations = allRegistrations || [];

        // Get user name from first registration
        if (registrations.length > 0 && registrations[0].first_name) {
          setUserName(registrations[0].first_name);
          localStorage.setItem('story_seed_user_name', registrations[0].first_name);
        }

        setSubmissions((registrations || []).slice(0, 5));

        const uniqueEventIds = new Set(
          (registrations || [])
            .map(r => r.event_id)
            .filter((id): id is string => id !== null)
        );

        const totalVotes = (registrations || []).reduce((sum, r) => sum + (r.overall_votes || 0), 0);
        const totalViews = (registrations || []).reduce((sum, r) => sum + (r.overall_views || 0), 0);

        setStats({
          totalSubmissions: registrations?.length || 0,
          totalVotes,
          totalViews,
          rank: 0,
          registeredEvents: uniqueEventIds.size,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const checkAuthAndFetchData = async () => {
      // Check for stored email from registration
      const storedEmail = localStorage.getItem('story_seed_user_email');
      
      if (storedEmail) {
        setUserEmail(storedEmail);
        setIsLoggedIn(true);
        await fetchUserData(storedEmail);
      } else {
        // No stored email - user needs to register first
        setIsLoggedIn(false);
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();

    // Real-time subscription for registrations
    const registrationsChannel = supabase
      .channel('user-registrations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'registrations' },
        async () => {
          const currentEmail = localStorage.getItem('story_seed_user_email');
          if (currentEmail) {
            await fetchUserData(currentEmail);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(registrationsChannel);
    };
  }, []);

  const handleLogout = async () => {
    // Clear all localStorage including verification status
    localStorage.removeItem('story_seed_user_email');
    localStorage.removeItem('story_seed_user_name');
    localStorage.removeItem('story_seed_user_id');
    localStorage.removeItem('story_seed_session_id');
    localStorage.removeItem('story_seed_user_phone');
    localStorage.removeItem('story_seed_user_role');
    localStorage.removeItem('story_seed_verified'); // Reset verification - user must verify again
    
    setIsLoggedIn(false);
    setUserEmail(null);
    setUserName(null);
    
    toast({ title: 'Logged Out', description: 'You have been logged out successfully. Please verify your email again to access dashboard.' });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md mx-auto p-8 bg-card rounded-3xl border border-border shadow-xl">
          <Mail className="w-16 h-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground mb-3">Registration Required</h2>
          <p className="text-muted-foreground mb-6">
            Please register for an event to access your dashboard and view your submissions.
          </p>
          <Link to="/register">
            <Button className="w-full" size="lg">
              Register for an Event
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 page-enter max-w-7xl mx-auto pb-8 md:pb-12">
      {/* Welcome Banner with Gradient */}
      <div 
        className="relative rounded-3xl p-8 md:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden group"
        style={{
          background: 'linear-gradient(to right, hsl(355, 82%, 56%), hsl(20, 90%, 55%), hsl(45, 100%, 51%))'
        }}
      >
        {/* Content */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 text-white">
              Welcome{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className="text-white/90 text-lg">
              Track your submissions, votes, and registrations all in one place.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Row with Glass-morphism */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between mb-4">
            <Calendar className={cn("w-8 h-8 text-primary transition-transform group-hover:scale-110")} />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stats.registeredEvents}</div>
          <div className="text-sm text-muted-foreground">Registered Events</div>
        </div>

        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between mb-4">
            <Trophy className={cn("w-8 h-8 text-accent transition-transform group-hover:scale-110")} />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stats.totalVotes.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Votes</div>
        </div>

        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between mb-4">
            <Eye className={cn("w-8 h-8 text-primary transition-transform group-hover:scale-110")} />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stats.totalViews.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Views</div>
        </div>

        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between mb-4">
            <FileText className={cn("w-8 h-8 text-secondary transition-transform group-hover:scale-110")} />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stats.totalSubmissions}</div>
          <div className="text-sm text-muted-foreground">Submissions</div>
        </div>

        <div className="relative backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className={cn("w-8 h-8 text-secondary transition-transform group-hover:scale-110")} />
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stats.rank > 0 ? `#${stats.rank}` : '-'}</div>
          <div className="text-sm text-muted-foreground">Rank</div>
        </div>
      </div>

      {/* Quick Actions with Red Theme */}
      <div className="relative rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">
          Quick Actions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Link to="/events" className="block group">
            <div className="relative bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Trophy className="w-6 h-6 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="font-semibold text-foreground mb-1">Explore & Vote</h3>
              <p className="text-sm text-muted-foreground">Vote for stories</p>
            </div>
          </Link>
          <Link to="/events" className="block group">
            <div className="relative bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Calendar className="w-6 h-6 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="font-semibold text-foreground mb-1">Browse Events</h3>
              <p className="text-sm text-muted-foreground">View all events</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsRegistrationsModalOpen(true)}
            className="block group w-full text-left"
          >
            <div className="relative bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <FileText className="w-6 h-6 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="font-semibold text-foreground mb-1">My Registrations</h3>
              <p className="text-sm text-muted-foreground">View submissions</p>
            </div>
          </button>
          <Link to="/leaderboard" className="block group">
            <div className="relative bg-primary/10 hover:bg-primary/20 border-2 border-primary/30 hover:border-primary/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <TrendingUp className="w-6 h-6 text-primary mb-3 transition-transform group-hover:scale-110" />
              <h3 className="font-semibold text-foreground mb-1">Leaderboard</h3>
              <p className="text-sm text-muted-foreground">Check rankings</p>
            </div>
          </Link>
        </div>
      </div>

      {/* My Registrations with Enhanced Glass-morphism */}
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.01] group/container overflow-hidden">
        {/* Glass morphism overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 dark:from-white/5 dark:via-transparent dark:to-white/5 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => setIsRegistrationsModalOpen(true)}
              className="font-display text-2xl md:text-3xl font-semibold text-foreground group-hover/container:text-primary transition-colors hover:text-primary cursor-pointer text-left"
            >
              My Registrations
            </button>
            <button 
              onClick={() => setIsRegistrationsModalOpen(true)}
              className="text-primary text-sm hover:underline font-medium transition-all duration-300 hover:text-primary/80 hover:scale-105"
            >
              View All →
            </button>
          </div>
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="relative backdrop-blur-lg bg-white/60 dark:bg-black/30 border border-white/40 dark:border-white/20 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/40 group/empty">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50 group-hover/empty:opacity-70 transition-opacity" />
                  <p className="text-lg font-medium">No submissions yet.</p>
                  <p className="text-sm mt-2">Start by registering for an event!</p>
                </div>
              </div>
            ) : (
              submissions.map((sub, index) => (
                <div
                  key={sub.id}
                  className={cn(
                    "relative backdrop-blur-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/20 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-primary/50 group/item animate-fade-in overflow-hidden"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover/item:from-primary/5 group-hover/item:via-primary/10 group-hover/item:to-primary/5 transition-all duration-300 pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg text-foreground group-hover/item:text-primary transition-colors">
                        {sub.story_title}
                      </h3>
                      <span className="px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md bg-primary/30 dark:bg-primary/20 text-primary border border-primary/40 group-hover/item:bg-primary/40 group-hover/item:border-primary/60 transition-all duration-300">
                        {sub.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground group-hover/item:text-foreground transition-colors">
                        {sub.events?.name || 'Unknown Event'}
                      </span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1.5 group-hover/item:text-primary transition-colors">
                          <Trophy className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                          <span className="font-medium">{sub.overall_votes}</span>
                        </span>
                        <span className="flex items-center gap-1.5 group-hover/item:text-primary transition-colors">
                          <Eye className="w-4 h-4 group-hover/item:scale-110 transition-transform" />
                          <span className="font-medium">{sub.overall_views}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link to="/register" className="block mt-6">
            <Button 
              variant="hero" 
              className="w-full group/btn backdrop-blur-lg bg-primary/90 hover:bg-primary shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-primary/20 hover:border-primary/40"
            >
              Submit New Story
              <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Registrations Modal */}
      <RegistrationsModal 
        open={isRegistrationsModalOpen} 
        onOpenChange={setIsRegistrationsModalOpen} 
      />
    </div>
  );
};

export default UserDashboard;
