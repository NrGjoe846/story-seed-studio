import { useState, useEffect } from 'react';
import { Users, Calendar, Trophy, BarChart3, TrendingUp, Eye, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalUsers: number;
  activeCompetitions: number;
  totalSubmissions: number;
  totalVotes: number;
}

interface Competition {
  id: string;
  name: string;
  participantCount: number;
  status: string;
  voteCount: number;
}

interface Activity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: string;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeCompetitions: 0,
    totalSubmissions: 0,
    totalVotes: 0,
  });
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active competitions
      const { count: activeCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch total submissions
      const { count: submissionsCount } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true });

      // Fetch total votes
      const { count: votesCount } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: usersCount || 0,
        activeCompetitions: activeCount || 0,
        totalSubmissions: submissionsCount || 0,
        totalVotes: votesCount || 0,
      });

      // Fetch competitions with stats
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      if (eventsData) {
        const compsWithStats = await Promise.all(
          eventsData.map(async (event) => {
            const { count: participantCount } = await supabase
              .from('registrations')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            const { data: regs } = await supabase
              .from('registrations')
              .select('overall_votes')
              .eq('event_id', event.id);

            const voteCount = regs?.reduce((sum, r) => sum + (r.overall_votes || 0), 0) || 0;

            const now = new Date();
            const start = event.start_date ? new Date(event.start_date) : null;
            const end = event.end_date ? new Date(event.end_date) : null;
            let status = 'Draft';
            if (event.is_active) {
              if (start && now < start) status = 'Upcoming';
              else if (end && now > end) status = 'Ended';
              else status = 'Live';
            }

            return {
              id: event.id,
              name: event.name,
              participantCount: participantCount || 0,
              status,
              voteCount,
            };
          })
        );
        setCompetitions(compsWithStats);
      }

      // Fetch recent activity from admin_notifications
      const { data: notifications } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifications) {
        setRecentActivity(
          notifications.map((n) => ({
            id: n.id,
            action: n.title,
            user: n.description || '',
            time: formatDistanceToNow(new Date(n.created_at), { addSuffix: true }),
            type: n.type,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time changes
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchDashboardData)
      .subscribe();

    const eventsChannel = supabase
      .channel('events-changes-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchDashboardData)
      .subscribe();

    const registrationsChannel = supabase
      .channel('registrations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, fetchDashboardData)
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, fetchDashboardData)
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_notifications' }, fetchDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(registrationsChannel);
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome */}
      <div className="bg-red rounded-2xl p-6 text-white">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Admin Dashboard 🛡️
        </h1>
        <p className="text-white/80">
          Welcome back, {user?.name}. Here's your platform overview.
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          iconColor="text-primary"
        />
        <StatsCard
          title="Active Competitions"
          value={stats.activeCompetitions}
          icon={Calendar}
          iconColor="text-secondary"
        />
        <StatsCard
          title="Total Submissions"
          value={stats.totalSubmissions.toLocaleString()}
          icon={Trophy}
          iconColor="text-accent"
        />
        <StatsCard
          title="Total Votes"
          value={stats.totalVotes.toLocaleString()}
          icon={BarChart3}
          iconColor="text-primary"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/dashboard/create">
          <Button
            variant="outline"
            className="w-full h-auto py-6 flex-col gap-2 transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground active:bg-primary active:text-primary-foreground"
          >
            <PlusCircle className="w-8 h-8" />
            <span>Create Competition</span>
          </Button>
        </Link>
        <Link to="/admin/dashboard/competitions">
          <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
            <Eye className="w-8 h-8" />
            <span>View Competitions</span>
          </Button>
        </Link>
        <Link to="/admin/dashboard/judges">
          <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
            <Users className="w-8 h-8" />
            <span>Manage Judges</span>
          </Button>
        </Link>
        <Link to="/admin/dashboard/outcomes">
          <Button
            variant="outline"
            className="w-full h-auto py-6 flex-col gap-2 transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground active:bg-primary active:text-primary-foreground"
          >
            <TrendingUp className="w-8 h-8" />
            <span>Voting Outcomes</span>
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Competitions */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Competitions
            </h2>
            <Link to="/admin/dashboard/competitions" className="text-primary text-sm hover:underline">
              Manage All
            </Link>
          </div>
          <div className="space-y-4">
            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{comp.name}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      comp.status === 'Live'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{comp.participantCount.toLocaleString()} participants</span>
                  <span>{comp.voteCount.toLocaleString()} votes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-2xl p-6 border border-border/50">
          <h2 className="font-display text-xl font-semibold text-foreground mb-6">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activity.type === 'registration'
                      ? 'bg-primary/10 text-primary'
                      : activity.type === 'vote'
                      ? 'bg-secondary/10 text-secondary'
                      : activity.type === 'comment'
                      ? 'bg-accent/10 text-accent'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {activity.type === 'registration' && <Users className="w-5 h-5" />}
                  {activity.type === 'vote' && <BarChart3 className="w-5 h-5" />}
                  {activity.type === 'comment' && <Trophy className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
