import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Copy, Check, Star, Gavel, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LeaderboardEntry {
  id: string;
  story_title: string;
  first_name: string;
  last_name: string;
  age: number;
  category: string;
  class_level: string | null;
  user_id: string | null;
  event_id: string | null;
  average_score: number;
  total_reviews: number;
}

interface Event {
  id: string;
  name: string;
}

const JudgeLeaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name')
      .eq('is_active', true);
    setEvents(data || []);
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('registrations')
        .select('id, story_title, first_name, last_name, age, category, class_level, user_id, event_id');
      
      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }
      
      const { data: registrations, error } = await query;
      if (error) throw error;

      // Fetch all votes with scores - we need to identify judge votes
      // Since RLS restricts user_roles access, we use the has_role function via RPC
      // or fetch votes and filter by checking if the voter has judge role
      const { data: votes } = await supabase
        .from('votes')
        .select('registration_id, user_id, score');

      // For judges viewing this page, we'll consider ALL votes as judge votes
      // since the page is specifically for judge rankings
      // The judge leaderboard shows rankings based on ALL votes cast
      // (In production, this would ideally use a database function to filter)
      
      // Create a set of all unique voter IDs
      const allVoterIds = [...new Set((votes || []).map(v => v.user_id))];
      
      // Since we can't query all user_roles due to RLS, we'll use an alternative approach:
      // Fetch votes that were made by judges by using the database function
      const judgeUserIds = new Set<string>();
      
      // Check each voter if they have judge role using has_role function
      for (const voterId of allVoterIds) {
        const { data: hasJudgeRole } = await supabase.rpc('has_role', {
          _user_id: voterId,
          _role: 'judge'
        });
        if (hasJudgeRole) {
          judgeUserIds.add(voterId);
        }
      }

      // Calculate average scores from judge votes only
      const scoreData: Record<string, { total: number; count: number }> = {};
      (votes || []).forEach(vote => {
        if (judgeUserIds.has(vote.user_id)) {
          if (!scoreData[vote.registration_id]) {
            scoreData[vote.registration_id] = { total: 0, count: 0 };
          }
          scoreData[vote.registration_id].total += vote.score;
          scoreData[vote.registration_id].count += 1;
        }
      });

      const entriesWithScores = (registrations || []).map(reg => {
        const data = scoreData[reg.id];
        return {
          ...reg,
          average_score: data ? parseFloat((data.total / data.count).toFixed(1)) : 0,
          total_reviews: data ? data.count : 0,
        };
      });

      setEntries(entriesWithScores);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchLeaderboard();

    const votesChannel = supabase
      .channel('judge-leaderboard-votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    const registrationsChannel = supabase
      .channel('judge-leaderboard-registrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(registrationsChannel);
    };
  }, [selectedEvent]);

  // Helper function to get top 6 balanced by class level (2 per class)
  const getBalancedTop6 = (sortedEntries: LeaderboardEntry[]): LeaderboardEntry[] => {
    const classLevels = ['Tiny Tales', 'Young Dreamers', 'Story Champions'];
    const top6: LeaderboardEntry[] = [];
    
    // First, try to get 2 from each class level
    for (const level of classLevels) {
      const entriesForLevel = sortedEntries.filter(e => e.class_level === level);
      const selected = entriesForLevel.slice(0, 2);
      top6.push(...selected);
    }
    
    // If we don't have 6, fill with remaining top entries
    if (top6.length < 6) {
      const top6Ids = new Set(top6.map(e => e.id));
      const remaining = sortedEntries.filter(e => !top6Ids.has(e.id));
      top6.push(...remaining.slice(0, 6 - top6.length));
    }
    
    // Re-sort the top 6 by score
    return top6.sort((a, b) => b.average_score - a.average_score).slice(0, 6);
  };

  // Sort by average score (highest first), then by total reviews as tiebreaker
  const sortedEntries = [...entries]
    .filter(e => e.total_reviews > 0)
    .sort((a, b) => {
      if (b.average_score !== a.average_score) return b.average_score - a.average_score;
      return b.total_reviews - a.total_reviews;
    });
  
  const top6 = getBalancedTop6(sortedEntries);
  const topThree = top6.slice(0, 3);
  const restEntries = sortedEntries.filter(e => !top6.some(t => t.id === e.id));

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500 text-yellow-900';
    if (rank === 2) return 'from-slate-300 to-slate-400 text-slate-800';
    if (rank === 3) return 'from-amber-600 to-orange-700 text-amber-100';
    return 'from-muted to-muted text-muted-foreground';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-slate-400 text-slate-900';
    if (rank === 3) return 'bg-amber-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const getCardShadow = (rank: number) => {
    if (rank === 1) return 'shadow-xl shadow-yellow-500/20 border-yellow-400/50';
    if (rank === 2) return 'shadow-lg shadow-slate-400/20 border-slate-400/50';
    if (rank === 3) return 'shadow-lg shadow-amber-500/20 border-amber-500/50';
    return 'border-border/50';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Fantasy: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
      Adventure: 'bg-green-500/20 text-green-700 border-green-500/30',
      'Sci-Fi': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
      Family: 'bg-pink-500/20 text-pink-700 border-pink-500/30',
      Humor: 'bg-orange-500/20 text-orange-700 border-orange-500/30',
    };
    return colors[category] || 'bg-primary/20 text-primary border-primary/30';
  };

  const copyUserId = (userId: string | null) => {
    if (!userId) return;
    navigator.clipboard.writeText(userId);
    setCopiedId(userId);
    toast.success('User ID copied!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateId = (id: string) => `${id.slice(0, 8)}...`;

  const getOrdinalSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="bg-gradient-to-r from-secondary to-accent rounded-2xl p-6 text-secondary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <Gavel className="w-8 h-8" />
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            Judge Leaderboard
          </h1>
        </div>
        <p className="text-secondary-foreground/80">
          Rankings based on average judge scores (out of 10) - professional assessments of storytelling excellence
        </p>
      </div>

      {/* Event Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-border/50">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="text-sm font-medium">Live Rankings</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedEntries.length === 0 ? (
        <div className="bg-card p-12 rounded-2xl border border-border/50 text-center">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Entries Yet</h3>
          <p className="text-muted-foreground">No judge reviews have been submitted yet.</p>
        </div>
      ) : (
        <>
          {/* Champions Section - Top 3 */}
          {topThree.length > 0 && (
            <div className="mb-8">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">
                  <span className="text-gradient">Judge's Top Picks</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[topThree[1], topThree[0], topThree[2]].filter(Boolean).map((entry) => {
                  if (!entry) return null;
                  const actualRank = sortedEntries.indexOf(entry) + 1;
                  const isFirst = actualRank === 1;
                  
                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        'bg-card rounded-2xl p-6 border-2 transition-all hover:scale-[1.02] relative overflow-hidden',
                        getCardShadow(actualRank),
                        isFirst && 'md:-mt-4 md:mb-4'
                      )}
                    >
                      <div className="absolute top-0 right-0">
                        <div className={cn(
                          'px-4 py-2 rounded-bl-2xl font-bold text-lg',
                          getRankBadgeColor(actualRank)
                        )}>
                          {actualRank}{getOrdinalSuffix(actualRank)}
                        </div>
                      </div>

                      <div className="flex justify-center mb-4">
                        <div className={cn(
                          'w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br',
                          getRankStyle(actualRank)
                        )}>
                          {actualRank === 1 ? (
                            <Crown className="w-10 h-10" />
                          ) : (
                            <Medal className="w-10 h-10" />
                          )}
                        </div>
                      </div>

                      <div className="text-center mb-4">
                        <h3 className="font-bold text-lg text-foreground mb-1 line-clamp-1">
                          {entry.first_name} {entry.last_name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {entry.story_title}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-foreground">{entry.average_score}</p>
                          <p className="text-xs text-muted-foreground">Avg Score /10</p>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{entry.total_reviews}</p>
                          <p className="text-xs text-muted-foreground">Reviews</p>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <span className={cn(
                          'px-3 py-1 text-xs font-medium rounded-full border',
                          getCategoryColor(entry.category)
                        )}>
                          {entry.category}
                        </span>
                      </div>

                      {entry.user_id && (
                        <button
                          onClick={() => copyUserId(entry.user_id)}
                          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <code className="font-mono">{truncateId(entry.user_id)}</code>
                          {copiedId === entry.user_id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rest of Entries - Table Style */}
          {restEntries.length > 0 && (
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Rank</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground">Participant</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground hidden md:table-cell">Story</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Category</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground">Avg Score</th>
                      <th className="text-center py-4 px-4 text-sm font-semibold text-muted-foreground hidden sm:table-cell">Reviews</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-muted-foreground">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restEntries.map((entry, index) => {
                      const rank = index + 4;
                      return (
                        <tr 
                          key={entry.id} 
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-muted-foreground">
                              {rank}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-semibold text-foreground">{entry.first_name} {entry.last_name}</p>
                              <p className="text-xs text-muted-foreground">Age {entry.age}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 hidden md:table-cell">
                            <p className="text-foreground line-clamp-1">{entry.story_title}</p>
                          </td>
                          <td className="py-4 px-4 hidden sm:table-cell">
                            <span className={cn(
                              'px-2 py-1 text-xs font-medium rounded-full border',
                              getCategoryColor(entry.category)
                            )}>
                              {entry.category}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-foreground">{entry.average_score}/10</span>
                          </td>
                          <td className="py-4 px-4 text-center hidden sm:table-cell">
                            <span className="text-muted-foreground">{entry.total_reviews}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {entry.user_id && (
                              <button
                                onClick={() => copyUserId(entry.user_id)}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <code className="font-mono">{truncateId(entry.user_id)}</code>
                                {copiedId === entry.user_id ? (
                                  <Check className="w-3 h-3 text-green-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JudgeLeaderboard;
