import { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Play, SkipBack, SkipForward, Gauge, Captions, CheckCircle2, Send, MessageCircle, Loader2, Eye, Star, ThumbsUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Registration {
  id: string;
  story_title: string;
  story_description: string;
  category: string;
  yt_link: string | null;
  user_id: string | null;
  first_name: string;
  last_name: string;
  created_at: string;
  overall_views: number;
  overall_votes: number;
  view_count: number;
  vote_count: number;
  comment_count: number;
  average_rating: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string | null;
}

interface VoteSummary {
  totalVotes: number;
  averageScore: number;
  userVote: number | null;
  hasVoted: boolean;
}

const UserExplore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedStory, setSelectedStory] = useState<Registration | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [showVotingPanel, setShowVotingPanel] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [captionsOn, setCaptionsOn] = useState(false);
  const [score, setScore] = useState(8);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [voteSummary, setVoteSummary] = useState<VoteSummary>({ totalVotes: 0, averageScore: 0, userVote: null, hasVoted: false });
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch top 3 from Judge Leaderboard and Community Leaderboard per event
  useEffect(() => {
    const fetchTopRegistrations = async () => {
      setIsLoading(true);
      
      // Get all events
      const { data: events } = await supabase
        .from('events')
        .select('id, name')
        .eq('is_active', true);

      // Get all registrations
      const { data: allRegistrations, error } = await supabase
        .from('registrations')
        .select('id, story_title, story_description, category, yt_link, user_id, first_name, last_name, created_at, overall_views, overall_votes, event_id');

      if (error) {
        console.error('Error fetching registrations:', error);
        setIsLoading(false);
        return;
      }

      // Get all votes with user roles to separate judge vs user votes
      const { data: allVotes } = await supabase
        .from('votes')
        .select('registration_id, score, user_id');

      // Get judge user IDs
      const { data: judgeRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      const judgeUserIds = new Set(judgeRoles?.map(r => r.user_id) || []);

      // Calculate scores for each registration
      const registrationScores = new Map<string, { judgeAvg: number; userVotes: number; judgeCount: number }>();
      
      (allRegistrations || []).forEach(reg => {
        const regVotes = (allVotes || []).filter(v => v.registration_id === reg.id);
        const judgeVotes = regVotes.filter(v => judgeUserIds.has(v.user_id));
        const userVotes = regVotes.filter(v => !judgeUserIds.has(v.user_id));
        
        const judgeAvg = judgeVotes.length > 0 
          ? judgeVotes.reduce((sum, v) => sum + v.score, 0) / judgeVotes.length 
          : 0;
        
        registrationScores.set(reg.id, {
          judgeAvg,
          userVotes: userVotes.length,
          judgeCount: judgeVotes.length
        });
      });

      const topRegistrationIds = new Set<string>();

      // Get top 3 from each event for both leaderboards
      (events || []).forEach(event => {
        const eventRegs = (allRegistrations || []).filter(r => r.event_id === event.id);
        
        // Top 3 by Judge Average Score (only those with judge reviews)
        const judgeTop = [...eventRegs]
          .filter(r => (registrationScores.get(r.id)?.judgeCount || 0) > 0)
          .sort((a, b) => (registrationScores.get(b.id)?.judgeAvg || 0) - (registrationScores.get(a.id)?.judgeAvg || 0))
          .slice(0, 3);
        
        // Top 3 by User Votes (community)
        const communityTop = [...eventRegs]
          .sort((a, b) => (registrationScores.get(b.id)?.userVotes || 0) - (registrationScores.get(a.id)?.userVotes || 0))
          .slice(0, 3);
        
        judgeTop.forEach(r => topRegistrationIds.add(r.id));
        communityTop.forEach(r => topRegistrationIds.add(r.id));
      });

      // Filter to only top registrations and add stats
      const topRegs = (allRegistrations || []).filter(r => topRegistrationIds.has(r.id));
      
      const registrationsWithStats = await Promise.all(
        topRegs.map(async (reg) => {
          const [viewsRes, votesRes, commentsRes] = await Promise.all([
            supabase.from('views').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id),
            supabase.from('votes').select('score').eq('registration_id', reg.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('registration_id', reg.id),
          ]);

          const votes = votesRes.data || [];
          const avgRating = votes.length > 0 ? votes.reduce((sum, v) => sum + v.score, 0) / votes.length : 0;
          const scores = registrationScores.get(reg.id);

          return {
            ...reg,
            view_count: viewsRes.count || 0,
            vote_count: votes.length,
            comment_count: commentsRes.count || 0,
            average_rating: avgRating,
            judge_avg: scores?.judgeAvg || 0,
            user_votes: scores?.userVotes || 0,
          };
        })
      );

      // Sort by judge average first, then user votes
      registrationsWithStats.sort((a, b) => {
        if ((b as any).judge_avg !== (a as any).judge_avg) {
          return (b as any).judge_avg - (a as any).judge_avg;
        }
        return (b as any).user_votes - (a as any).user_votes;
      });

      setRegistrations(registrationsWithStats);
      setIsLoading(false);
    };

    fetchTopRegistrations();
  }, []);

  // Fetch votes and comments when a story is selected
  useEffect(() => {
    if (!selectedStory) return;

    const fetchVotesAndComments = async () => {
      // Fetch votes
      const { data: votesData } = await supabase
        .from('votes')
        .select('score, user_id')
        .eq('registration_id', selectedStory.id);

      if (votesData) {
        const totalVotes = votesData.length;
        const averageScore = totalVotes > 0 
          ? votesData.reduce((sum, v) => sum + v.score, 0) / totalVotes 
          : 0;
        const userVoteData = user?.id 
          ? votesData.find(v => v.user_id === user.id)
          : null;
        const userVote = userVoteData?.score || null;
        const hasVoted = !!userVoteData;

        setVoteSummary({ totalVotes, averageScore, userVote, hasVoted });
        if (hasVoted) {
          setScore(userVote || 8);
          setVoteSubmitted(true);
        }
      }

      // Fetch comments with user profiles
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id, content, user_id, created_at')
        .eq('registration_id', selectedStory.id)
        .order('created_at', { ascending: true });

      if (commentsData) {
        // Fetch user names and avatars for comments
        const userIds = [...new Set(commentsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar')
          .in('id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.id, { name: p.name, avatar: p.avatar }]) || []);
        
        const commentsWithNames = commentsData.map(c => ({
          ...c,
          user_name: profileMap.get(c.user_id)?.name || 'Anonymous',
          user_avatar: profileMap.get(c.user_id)?.avatar
        }));
        
        setComments(commentsWithNames);
      }
    };

    fetchVotesAndComments();

    // Realtime subscription for votes
    const votesChannel = supabase
      .channel(`votes-${selectedStory.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes', filter: `registration_id=eq.${selectedStory.id}` },
        () => fetchVotesAndComments()
      )
      .subscribe();

    // Realtime subscription for comments
    const commentsChannel = supabase
      .channel(`comments-${selectedStory.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `registration_id=eq.${selectedStory.id}` },
        () => fetchVotesAndComments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(votesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [selectedStory, user?.id]);

  const filteredStories = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return registrations;
    return registrations.filter((reg) => {
      return (
        reg.story_title.toLowerCase().includes(q) ||
        reg.first_name.toLowerCase().includes(q) ||
        reg.last_name.toLowerCase().includes(q) ||
        reg.category.toLowerCase().includes(q) ||
        reg.user_id?.toLowerCase().includes(q)
      );
    });
  }, [query, registrations]);

  // Search by user_id
  const searchedUserStories = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    
    // Check if searching by user_id
    const userStories = registrations.filter(r => r.user_id === q);
    if (userStories.length > 0) {
      return userStories;
    }
    return null;
  }, [query, registrations]);

  const openPlayer = (story: Registration, searchedUserId?: string) => {
    setSelectedStory(story);
    setIsPlayerOpen(true);
    setShowVotingPanel(false);
    setScore(8);
    setVoteSubmitted(false);
    setVoteSummary({ totalVotes: 0, averageScore: 0, userVote: null, hasVoted: false });
    setComments([]);
    
    // Track view if user is logged in
    if (user?.id) {
      trackView(story.id);
      // Track trending interaction if this was from a user_id search
      if (searchedUserId) {
        trackTrendingInteraction(story.id, searchedUserId);
      }
    }
  };

  const trackView = async (registrationId: string) => {
    if (!user?.id) return;
    
    try {
      // Check if user already viewed this story
      const { data: existingView } = await supabase
        .from('views')
        .select('id')
        .eq('registration_id', registrationId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingView) {
        await supabase.from('views').insert({
          registration_id: registrationId,
          user_id: user.id,
        });
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const trackTrendingInteraction = async (registrationId: string, searchedUserId: string) => {
    try {
      await supabase.from('trending_interactions').insert({
        registration_id: registrationId,
        user_id: user?.id || null,
        interaction_type: 'search_watch',
        searched_user_id: searchedUserId,
      });
    } catch (error) {
      console.error('Error tracking trending interaction:', error);
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        videoRef.current.currentTime + seconds
      );
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleClosePlayer = () => {
    setIsPlayerOpen(false);
    setSelectedStory(null);
    setShowVotingPanel(false);
    setPlaybackRate(1);
  };

  const handleSubmitVote = async () => {
    if (!user?.id || !selectedStory) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingVote(true);

    try {
      const { error } = await supabase
        .from('votes')
        .upsert({
          registration_id: selectedStory.id,
          user_id: user.id,
          score: score,
        }, {
          onConflict: 'registration_id,user_id'
        });

      if (error) {
        console.error('Vote error:', error);
        toast({
          title: 'Error',
          description: 'Failed to submit vote. Please try again.',
          variant: 'destructive',
        });
      } else {
        setVoteSubmitted(true);
        toast({
          title: 'Vote Submitted!',
          description: `You rated this story ${score}/10`,
        });
      }
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user?.id || !selectedStory || !newComment.trim()) {
      toast({
        title: 'Error',
        description: 'Please login and enter a comment.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingComment(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          registration_id: selectedStory.id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) {
        console.error('Comment error:', error);
        toast({
          title: 'Error',
          description: 'Failed to post comment. Please try again.',
          variant: 'destructive',
        });
      } else {
        setNewComment('');
        toast({
          title: 'Comment Posted!',
        });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getVideoUrl = (ytLink: string | null) => {
    if (!ytLink) return null;
    
    // Handle YouTube URLs
    if (ytLink.includes('youtube.com') || ytLink.includes('youtu.be')) {
      const videoId = ytLink.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/)?.[1];
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Return as-is for direct video URLs
    return ytLink;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Featured Stories</h1>
          <p className="text-muted-foreground text-sm">
            Top 3 stories from Judge & Community Leaderboards across all events.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, name, category, or user ID..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Show user-specific stories if searching by user_id */}
      {searchedUserStories ? (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Stories by User: {query}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {searchedUserStories.map((reg) => (
              <StoryCard key={reg.id} story={reg} onPlay={(story) => openPlayer(story, query)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredStories.map((reg) => (
            <StoryCard key={reg.id} story={reg} onPlay={openPlayer} />
          ))}
          {filteredStories.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No stories found. Try a different search term.
            </div>
          )}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={isPlayerOpen} onOpenChange={(open) => !open && handleClosePlayer()}>
        <DialogContent className="max-w-5xl h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col">
          {selectedStory && (
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              {/* Back Button */}
              <button
                onClick={handleClosePlayer}
                className="absolute top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-background/90 backdrop-blur-sm rounded-lg hover:bg-background transition-colors text-foreground shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Back to Explore</span>
              </button>
              
              {/* Video Section */}
              <div className="md:w-2/3 bg-black flex flex-col min-h-0">
                <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden">
                  {selectedStory.yt_link ? (
                    getVideoUrl(selectedStory.yt_link)?.includes('youtube.com/embed') ? (
                      <iframe
                        src={getVideoUrl(selectedStory.yt_link) || ''}
                        className="w-full h-full min-h-[250px] sm:min-h-[300px]"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={selectedStory.yt_link}
                        className="w-full h-full max-h-[400px] sm:max-h-[520px] object-contain bg-black"
                        controls
                        autoPlay
                      />
                    )
                  ) : (
                    <div className="text-white text-center p-8">
                      <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>Video not available yet</p>
                    </div>
                  )}
                </div>

                {/* Controls */}
                {selectedStory.yt_link && !getVideoUrl(selectedStory.yt_link)?.includes('youtube.com/embed') && (
                  <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs text-white bg-gradient-to-t from-black via-black/80 to-black/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSkip(-10)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <SkipBack className="w-3 h-3" />
                        <span>10s</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSkip(10)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>10s</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSpeedChange(playbackRate === 2 ? 0.5 : playbackRate + 0.5)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <Gauge className="w-3 h-3" />
                        <span>{playbackRate}x</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCaptionsOn(!captionsOn)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors ${
                          captionsOn ? 'bg-primary text-primary-foreground' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        <Captions className="w-3 h-3" />
                        <span>CC</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Info & Voting Panel */}
              <div className="md:w-1/3 flex flex-col bg-card overflow-hidden min-h-0">
                <div className="p-4 border-b border-border overflow-y-auto flex-shrink-0">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {selectedStory.story_title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    by {selectedStory.first_name} {selectedStory.last_name}
                  </p>
                  <span className="inline-block mt-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {selectedStory.category}
                  </span>
                  
                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {selectedStory.view_count} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      {selectedStory.vote_count} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {selectedStory.comment_count}
                    </span>
                    {selectedStory.average_rating > 0 && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Star className="w-3.5 h-3.5 fill-secondary" />
                        {selectedStory.average_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-3">
                    {selectedStory.story_description}
                  </p>
                </div>

                {/* Voting Section */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Rating</span>
                    <span className="text-sm text-muted-foreground">
                      {voteSummary.totalVotes} votes • Avg: {voteSummary.averageScore.toFixed(1)}/10
                    </span>
                  </div>

                  {voteSummary.hasVoted ? (
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        You voted {voteSummary.userVote}/10
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Votes cannot be changed</p>
                    </div>
                  ) : !showVotingPanel ? (
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => setShowVotingPanel(true)}
                    >
                      Vote for this Story
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setScore(num)}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                              score >= num
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      <p className="text-center text-sm text-muted-foreground">
                        Your rating: <span className="font-bold text-foreground">{score}/10</span>
                      </p>
                      <Button
                        variant="hero"
                        className="w-full"
                        onClick={handleSubmitVote}
                        disabled={isSubmittingVote || voteSubmitted}
                      >
                        {isSubmittingVote ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : voteSubmitted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Vote Submitted
                          </>
                        ) : (
                          'Submit Vote'
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                  <div className="p-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Comments ({comments.length})
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {comments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={comment.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} />
                              <AvatarFallback>{comment.user_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground">
                              {comment.user_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="p-4 border-t border-border flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                      />
                      <Button
                        size="sm"
                        onClick={handleSubmitComment}
                        disabled={isSubmittingComment || !newComment.trim()}
                      >
                        {isSubmittingComment ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Story Card Component
const StoryCard = ({ story, onPlay }: { story: Registration; onPlay: (story: Registration) => void }) => {
  return (
    <button
      type="button"
      onClick={() => onPlay(story)}
      className="group rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-xl transition-shadow duration-300 text-left"
    >
      <div className="relative aspect-video bg-muted">
        {story.yt_link ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
            <Play className="w-12 h-12 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Play className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="truncate">
            <p className="font-semibold truncate">{story.story_title}</p>
            <p className="text-[11px] text-white/80 truncate">
              {story.first_name} {story.last_name}
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium text-xs">
            {story.category}
          </span>
          <span className="text-muted-foreground text-[11px]">
            {new Date(story.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {story.view_count}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {story.vote_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {story.comment_count}
            </span>
          </div>
          {story.average_rating > 0 && (
            <span className="flex items-center gap-1 text-secondary">
              <Star className="w-3 h-3 fill-secondary" />
              {story.average_rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default UserExplore;