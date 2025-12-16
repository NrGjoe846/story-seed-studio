import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, ArrowUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry {
  id: string;
  story_title: string;
  first_name: string;
  last_name: string;
  overall_votes: number;
  views_count: number;
}

const AdminOutcomes = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVotes: 0, activeVoters: 0, avgVotes: 0 });
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const fetchData = async () => {
    try {
      // Build query
      let query: any = supabase
        .from('registrations')
        .select('id, story_title, first_name, last_name, overall_votes, role')
        .order('overall_votes', { ascending: false })
        .limit(20);

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data: registrationsData, error } = await query;

      if (error) throw error;

      const registrations = registrationsData as any[];

      // Get view counts
      const entriesWithViews = await Promise.all(
        (registrations || []).map(async (reg) => {
          const { count } = await supabase
            .from('views')
            .select('*', { count: 'exact', head: true })
            .eq('registration_id', reg.id);

          return {
            ...reg,
            views_count: count || 0,
          };
        })
      );

      setEntries(entriesWithViews);

      // Calculate stats
      const { count: totalVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      const { data: uniqueVoters } = await supabase
        .from('votes')
        .select('user_id')
        .limit(1000);

      const uniqueVoterIds = new Set(uniqueVoters?.map(v => v.user_id) || []);

      const totalVotesCount = totalVotes || 0;
      const entriesCount = registrations?.length || 1;

      setStats({
        totalVotes: totalVotesCount,
        activeVoters: uniqueVoterIds.size,
        avgVotes: Math.round(totalVotesCount / entriesCount),
      });
    } catch (error) {
      console.error('Error fetching outcomes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-outcomes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'views' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roleFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <h1 className="font-display text-2xl font-bold text-foreground">Voting Outcomes</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="bg-card p-6 rounded-2xl border border-border/50">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-secondary" />
              <h2 className="font-display text-xl font-semibold text-foreground">Current Leaderboard</h2>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="college">College</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No entries yet.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-xl rank-rise ${i === 0 ? 'bg-gradient-to-r from-secondary/20 to-accent/10' : 'bg-muted/30'
                    }`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{entry.story_title}</p>
                    <p className="text-xs text-muted-foreground">{entry.first_name} {entry.last_name}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-secondary" />
                        {entry.overall_votes.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm flex items-center gap-1">
                        <Eye className="w-3 h-3 text-primary" />
                        {entry.views_count.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-card p-6 rounded-2xl border border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold text-foreground">Statistics</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground text-sm">Total Votes</p>
              <p className="font-display text-3xl font-bold text-foreground">
                {stats.totalVotes.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground text-sm">Active Voters</p>
              <p className="font-display text-3xl font-bold text-foreground">
                {stats.activeVoters.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-muted-foreground text-sm">Avg. Votes per Entry</p>
              <p className="font-display text-3xl font-bold text-foreground">
                {stats.avgVotes.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOutcomes;