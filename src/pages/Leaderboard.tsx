import { useState, useEffect } from 'react';
import { Trophy, Crown, Calendar, Users, Gavel } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
interface CommunityEntry {
  id: string;
  story_title: string;
  first_name: string;
  last_name: string;
  age: number;
  category: string;
  class_level: string | null;
  overall_views: number;
  event_id: string | null;
  vote_count: number;
  role: string | null;
}
interface JudgeEntry {
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
  role: string | null;
}
interface Event {
  id: string;
  name: string;
  event_type?: 'school' | 'college' | 'both';
}
const Leaderboard = () => {
  const [communityEntries, setCommunityEntries] = useState<CommunityEntry[]>([]);
  const [judgeEntries, setJudgeEntries] = useState<JudgeEntry[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<'school' | 'college' | 'both'>('both');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const {
      data
    } = await supabase.from('events').select('id, name, event_type').eq('is_active', true);
    if (data && data.length > 0) {
      setEvents(data.map(e => ({ ...e, event_type: (e as any).event_type || 'both' })));
      // Auto-select first event if none selected
      if (!selectedEvent) {
        setSelectedEvent(data[0].id);
        setSelectedEventType((data[0] as any).event_type || 'both');
      }
    }
  };
  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      if (!selectedEvent) return;

      const currentEvent = events.find(e => e.id === selectedEvent);
      const isCollegeEvent = currentEvent?.event_type === 'college';

      if (isCollegeEvent) {
        // Fetch from clg_registrations for college events
        const { data: registrationsData, error } = await supabase
          .from('clg_registrations')
          .select('id, story_title, first_name, last_name, age, category, overall_views, overall_votes, user_id, event_id, college_name')
          .eq('event_id', selectedEvent);

        if (error) throw error;

        const registrations = (registrationsData || []).map(r => ({
          ...r,
          class_level: null // College doesn't have class levels
        }));

        // Get judge votes from clg_votes table
        const { data: votes } = await supabase.from('clg_votes').select('registration_id, user_id, score');

        // Process judge votes
        const scoreData: Record<string, { total: number; count: number }> = {};
        (votes || []).forEach(vote => {
          if (!scoreData[vote.registration_id]) {
            scoreData[vote.registration_id] = { total: 0, count: 0 };
          }
          scoreData[vote.registration_id].total += vote.score;
          scoreData[vote.registration_id].count += 1;
        });

        // Judge leaderboard - simple top ranking for college (no class level distribution)
        const judgeEntriesWithScores = registrations.map(reg => {
          const data = scoreData[reg.id];
          return {
            ...reg,
            role: null,
            average_score: data ? parseFloat((data.total / data.count).toFixed(1)) : 0,
            total_reviews: data ? data.count : 0
          };
        });

        setCommunityEntries([]); // No community voting for college events
        setJudgeEntries(judgeEntriesWithScores as JudgeEntry[]);
      } else {
        // School events - use existing registrations table
        const { data: registrationsData, error } = await supabase
          .from('registrations')
          .select('id, story_title, first_name, last_name, age, category, class_level, overall_views, overall_votes, user_id, event_id')
          .eq('event_id', selectedEvent);

        if (error) throw error;

        const registrations = registrationsData as any[];

        // Get all votes from votes table
        const { data: votes } = await supabase.from('votes').select('registration_id, user_id, score');

        // Get judge user IDs
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role');

        const judgeUserIds = new Set(
          (userRoles || [])
            .filter(ur => ur.role === 'judge')
            .map(ur => ur.user_id)
        );

        // Calculate judge scores per registration
        const judgeScoreData: Record<string, { total: number; count: number }> = {};
        (votes || []).forEach(vote => {
          if (judgeUserIds.has(vote.user_id)) {
            if (!judgeScoreData[vote.registration_id]) {
              judgeScoreData[vote.registration_id] = { total: 0, count: 0 };
            }
            judgeScoreData[vote.registration_id].total += vote.score;
            judgeScoreData[vote.registration_id].count += 1;
          }
        });

        // Judge leaderboard uses average scores from judge votes
        const judgeEntriesWithScores = (registrations || []).map(reg => {
          const data = judgeScoreData[reg.id];
          return {
            ...reg,
            average_score: data ? parseFloat((data.total / data.count).toFixed(1)) : 0,
            total_reviews: data ? data.count : 0
          };
        });

        // Get judge top 6 (2 per class level) to exclude from community voting pool
        const sortedByJudgeScore = [...judgeEntriesWithScores]
          .filter(e => e.total_reviews > 0)
          .sort((a, b) => {
            if (b.average_score !== a.average_score) return b.average_score - a.average_score;
            return b.total_reviews - a.total_reviews;
          });

        const classLevels = ['Tiny Tales', 'Young Dreamers', 'Story Champions'];
        const judgeTop6Ids: string[] = [];

        for (const level of classLevels) {
          const entriesForLevel = sortedByJudgeScore.filter(e => e.class_level === level);
          const selected = entriesForLevel.slice(0, 2);
          judgeTop6Ids.push(...selected.map(e => e.id));
        }

        // Fill remaining if needed
        if (judgeTop6Ids.length < 6) {
          const remaining = sortedByJudgeScore.filter(e => !judgeTop6Ids.includes(e.id));
          judgeTop6Ids.push(...remaining.slice(0, 6 - judgeTop6Ids.length).map(e => e.id));
        }

        // Get top 45 from judge rankings (excluding judge top 6) for community voting eligibility
        const remainingAfterJudgeTop6 = sortedByJudgeScore.filter(e => !judgeTop6Ids.includes(e.id));
        const eligibleForCommunityVotingIds = remainingAfterJudgeTop6.slice(0, 45).map(e => e.id);

        // Community leaderboard: only from eligible pool, sorted by overall_votes
        // Apply balanced 2 per class level for community leaderboard display
        const communityEntriesWithVotes = (registrations || [])
          .filter(reg => eligibleForCommunityVotingIds.includes(reg.id))
          .map(reg => ({
            ...reg,
            vote_count: reg.overall_votes || 0
          }));

        setCommunityEntries(communityEntriesWithVotes);
        setJudgeEntries(judgeEntriesWithScores);
      }
    } catch (error) {
      console.error('Error fetching leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);
  useEffect(() => {
    fetchLeaderboards();
    const votesChannel = supabase.channel('leaderboard-votes-public').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'votes'
    }, () => {
      fetchLeaderboards();
    }).subscribe();
    const registrationsChannel = supabase.channel('leaderboard-registrations-public').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'registrations'
    }, () => {
      fetchLeaderboards();
    }).subscribe();
    // College tables listeners
    const clgVotesChannel = supabase.channel('leaderboard-clg-votes-public').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clg_votes'
    }, () => {
      fetchLeaderboards();
    }).subscribe();
    const clgRegistrationsChannel = supabase.channel('leaderboard-clg-registrations-public').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'clg_registrations'
    }, () => {
      fetchLeaderboards();
    }).subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(registrationsChannel);
      supabase.removeChannel(clgVotesChannel);
      supabase.removeChannel(clgRegistrationsChannel);
    };
  }, [selectedEvent, events]);
  const getBalancedTop6 = <T extends {
    class_level: string | null;
  },>(sortedEntries: T[], getScore: (e: T) => number): T[] => {
    const classLevels = ['Tiny Tales', 'Young Dreamers', 'Story Champions'];
    const top6: T[] = [];
    for (const level of classLevels) {
      const entriesForLevel = sortedEntries.filter(e => e.class_level === level);
      const selected = entriesForLevel.slice(0, 2);
      top6.push(...selected);
    }
    if (top6.length < 6) {
      const top6Ids = new Set(top6.map((e: any) => e.id));
      const remaining = sortedEntries.filter((e: any) => !top6Ids.has(e.id));
      top6.push(...remaining.slice(0, 6 - top6.length));
    }
    return top6.sort((a, b) => getScore(b) - getScore(a)).slice(0, 6);
  };
  const sortedCommunityEntries = [...communityEntries].sort((a, b) => b.vote_count - a.vote_count);
  const communityTop6 = getBalancedTop6(sortedCommunityEntries, e => e.vote_count);
  const communityTopThree = communityTop6.slice(0, 3);
  const communityRestTop6 = communityTop6.slice(3);

  const sortedJudgeEntries = [...judgeEntries].filter(e => e.total_reviews > 0).sort((a, b) => {
    if (b.average_score !== a.average_score) return b.average_score - a.average_score;
    return b.total_reviews - a.total_reviews;
  });
  
  // For college events, use simple top ranking; for school events, use balanced class-level distribution
  const isCollegeEvent = selectedEventType === 'college' || selectedEventType === 'both';
  const judgeTop6 = isCollegeEvent 
    ? sortedJudgeEntries.slice(0, 6) 
    : getBalancedTop6(sortedJudgeEntries, e => e.average_score);
  const judgeTopThree = judgeTop6.slice(0, 3);
  const judgeRestTop6 = judgeTop6.slice(3);
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format score display based on type
  const formatScore = (entry: any, type: 'community' | 'judge') => {
    if (type === 'judge') {
      return `${(entry as JudgeEntry).average_score}/10`;
    }
    return `${(entry as CommunityEntry).vote_count} votes`;
  };
  const formatScoreShort = (entry: any, type: 'community' | 'judge') => {
    if (type === 'judge') {
      return (entry as JudgeEntry).average_score;
    }
    return (entry as CommunityEntry).vote_count;
  };

  // Podium component for top 3 with animations
  const renderPodium = (entries: (CommunityEntry | JudgeEntry)[], type: 'community' | 'judge') => {
    if (entries.length === 0) return null;
    const orderedEntries = [entries[1], entries[0], entries[2]].filter(Boolean);
    const pedestalHeights = ['h-32', 'h-40', 'h-28'];
    const pedestalOrder = [2, 1, 3];
    // Animation delays: 2nd place first, then 1st, then 3rd
    const animationDelays = ['animation-delay-100', 'animation-delay-300', 'animation-delay-200'];

    return <div className="relative pt-8 pb-4">
      {/* Crown for winner */}
      {entries[0] && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500 drop-shadow-lg animate-bounce" style={{ animationDuration: '2s' }} />
      </div>}

      <div className="flex items-end justify-center gap-2 md:gap-4">
        {orderedEntries.map((entry, index) => {
          if (!entry) return null;
          const actualRank = pedestalOrder[index];
          const scoreDisplay = formatScore(entry, type);
          const delay = index === 0 ? '100ms' : index === 1 ? '300ms' : '200ms';

          return <div
            key={entry.id}
            className="flex flex-col items-center animate-fade-in opacity-0"
            style={{
              animationDelay: delay,
              animationFillMode: 'forwards',
              animationDuration: '0.5s'
            }}
          >
            {/* Avatar */}
            <div className={cn("relative mb-2 transition-transform hover:scale-110", actualRank === 1 && "mt-[-20px]")}>
              <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-full border-4 flex items-center justify-center text-lg md:text-xl font-bold shadow-xl overflow-hidden", actualRank === 1 && "border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-800", actualRank === 2 && "border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700", actualRank === 3 && "border-amber-600 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800")}>
                {getInitials(entry.first_name, entry.last_name)}
              </div>
            </div>

            {/* Name */}
            <p className="text-xs md:text-sm font-semibold text-white text-center max-w-[80px] md:max-w-[100px] truncate drop-shadow-md">
              {entry.first_name} {entry.last_name}
            </p>

            {/* Pedestal */}
            <div className={cn("w-20 md:w-28 mt-2 rounded-t-lg flex flex-col items-center justify-start pt-3 transition-all", pedestalHeights[index], actualRank === 1 && "bg-gradient-to-b from-yellow-400 to-yellow-500", actualRank === 2 && "bg-gradient-to-b from-slate-300 to-slate-400", actualRank === 3 && "bg-gradient-to-b from-amber-500 to-amber-600")}>
              {/* Score badge */}
              <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 md:px-3 py-1 shadow-md">
                <span className="text-xs md:text-sm font-bold text-gray-800">{scoreDisplay}</span>
              </div>

              {/* Rank number */}
              <span className={cn("text-4xl md:text-5xl font-black mt-2", actualRank === 1 && "text-yellow-900/30", actualRank === 2 && "text-slate-600/30", actualRank === 3 && "text-amber-900/30")}>
                {actualRank}
              </span>
            </div>
          </div>;
        })}
      </div>
    </div>;
  };

  // List item component with animation
  const renderListItem = (entry: CommunityEntry | JudgeEntry, rank: number, index: number, type: 'community' | 'judge') => {
    const scoreDisplay = formatScore(entry, type);
    const delay = `${500 + (index * 100)}ms`;

    return <div
      key={entry.id}
      className="flex items-center gap-3 md:gap-4 py-3 px-4 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-b-0 animate-fade-in opacity-0"
      style={{ animationDelay: delay, animationFillMode: 'forwards', animationDuration: '0.4s' }}
    >
      {/* Rank */}
      <span className="w-8 text-sm font-semibold text-muted-foreground">{rank}</span>

      {/* Avatar */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground border-2 border-border">
        {getInitials(entry.first_name, entry.last_name)}
      </div>

      {/* Name & Story */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm md:text-base text-foreground truncate">
          {entry.first_name} {entry.last_name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{entry.story_title}</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {type === 'community' ? <Users className="w-4 h-4 text-primary" /> : <Gavel className="w-4 h-4 text-primary" />}
        </div>
        <span className="font-bold text-xs md:text-sm text-foreground min-w-[60px] text-right">{scoreDisplay}</span>
      </div>
    </div>;
  };
  const renderLeaderboard = (topThree: (CommunityEntry | JudgeEntry)[], restEntries: (CommunityEntry | JudgeEntry)[], sortedAll: (CommunityEntry | JudgeEntry)[], type: 'community' | 'judge', title: string, subtitle: string, icon: React.ReactNode) => {
    if (sortedAll.length === 0) {
      return <div className="text-center py-16">
        <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Entries Yet</h3>
        <p className="text-muted-foreground">Be the first to participate!</p>
      </div>;
    }
    return <div className="space-y-6">
      {/* Podium Section with gradient background */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-300 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 px-4 pt-6 pb-0">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
              {icon}
            </div>
            <div className="text-center">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-md">{title}</h2>
              <p className="text-xs md:text-sm text-white/80">{subtitle}</p>
            </div>
          </div>

          {/* Podium */}
          {renderPodium(topThree, type)}
        </div>
      </div>

      {/* Remaining entries (4-6 from balanced selection + rest) */}
      {restEntries.length > 0 && <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="divide-y divide-border/50">
          {restEntries.map((entry, index) => {
            return renderListItem(entry, index + 4, index, type);
          })}
        </div>
      </div>}
    </div>;
  };
  return <div className="page-enter min-h-screen bg-background">
    {/* Compact Header */}
    <section className="py-8 md:py-12 bg-gradient-to-br from-primary via-primary to-primary/80 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:20px_20px]"></div>
      </div>
      {/* Left Trophy - Bottom Aligned */}
      <div className="absolute left-[8%] sm:left-[15%] md:left-[20%] lg:left-[25%] xl:left-[28%] bottom-5 z-20">
        <img
          src="/assets/trophy-icon.png"
          alt="Trophy Left"
          className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain object-bottom drop-shadow-lg"
        />
      </div>
      {/* Right Trophy - Bottom Aligned */}
      <div className="absolute right-[8%] sm:right-[15%] md:right-[20%] lg:right-[25%] xl:right-[28%] bottom-5 z-20">
        <img
          src="/assets/trophy-icon.png"
          alt="Trophy Right"
          className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain object-bottom drop-shadow-lg"
        />
      </div>
      <div className="container mx-auto px-2 md:px-4 text-center relative z-10">
        <h1 className="font-display text-xl md:text-4xl font-bold text-primary-foreground mb-1 md:mb-2 leading-tight pt-2">
          Story <span className="text-primary-foreground">Champions</span>
        </h1>
        <p className="text-primary-foreground/90 text-xs md:text-base pb-2">Live Rankings</p>
      </div>
    </section>

    <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
      {/* Event Filter */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 border border-border shadow-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedEvent} onValueChange={(value) => {
            setSelectedEvent(value);
            const event = events.find(e => e.id === value);
            setSelectedEventType(event?.event_type || 'both');
          }}>
            <SelectTrigger className="border-0 bg-transparent w-[160px] focus:ring-0">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              {events.map(event => <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div> : selectedEventType === 'school' ? (
        <Tabs defaultValue="community" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
            <TabsTrigger
              value="community"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger
              value="judge"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Gavel className="w-4 h-4" />
              <span className="hidden sm:inline">Judge</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="community">
            {renderLeaderboard(communityTopThree, communityRestTop6, communityTop6, 'community', 'Community Leaderboard', 'Most Voted Stories', <Users className="w-5 h-5 text-white" />)}
          </TabsContent>

          <TabsContent value="judge">
            {renderLeaderboard(judgeTopThree, judgeRestTop6, judgeTop6, 'judge', 'Judge Leaderboard', 'Expert Evaluations', <Gavel className="w-5 h-5 text-white" />)}
          </TabsContent>
        </Tabs>
      ) : (
        // For college and both events - only show Judge Leaderboard
        <div className="w-full">
          {renderLeaderboard(judgeTopThree, judgeRestTop6, judgeTop6, 'judge', 'Judge Leaderboard', 'Expert Evaluations', <Gavel className="w-5 h-5 text-white" />)}
        </div>
      )}
    </div>
  </div>;
};
export default Leaderboard;
