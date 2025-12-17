import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, Eye, X, Share2, Play, Loader2, User, Phone, Search, ArrowLeft, Copy, Check, MessageCircle, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Contestant {
  id: string;
  first_name: string;
  last_name: string;
  story_title: string;
  story_description: string;
  age: number;
  category: string;
  class_level: string | null;
  yt_link: string | null;
  overall_votes: number;
  overall_views: number;
  photo: string;
  event_name?: string;
  city?: string;
  email?: string;
  phone?: string;
  created_at?: string;
}

const Voting = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if user is logged in
  useEffect(() => {
    const storedPhone = localStorage.getItem('story_seed_user_phone');
    const storedEmail = localStorage.getItem('story_seed_user_email');
    const isLoggedIn = (!!storedPhone && storedPhone.length >= 10) || (!!storedEmail && storedEmail.length > 0);
    
    if (!isLoggedIn) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote.',
        variant: 'destructive',
      });
      navigate('/user');
    }
  }, [navigate, toast]);
  
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [judgeTop6Ids, setJudgeTop6Ids] = useState<Set<string>>(new Set());
  const [selectedContestant, setSelectedContestant] = useState<Contestant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [voterName, setVoterName] = useState('');
  const [voterPhone, setVoterPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [canVoteStatus, setCanVoteStatus] = useState<{ canVote: boolean; reason?: string }>({ canVote: true });
  const [checkingVote, setCheckingVote] = useState(false);
  const [hasRecordedView, setHasRecordedView] = useState(false);

  // Store IDs of participants that should be shown (top 45 from judge rankings, excluding top 6)
  const [eligibleForVotingIds, setEligibleForVotingIds] = useState<Set<string>>(new Set());

  // Fetch judge rankings and get top 45 (excluding top 6 winners) for voting page
  const fetchJudgeRankingsForVoting = async (eventIdToFetch: string) => {
    try {
      // Fetch registrations for this event
      const { data: registrations } = await supabase
        .from('registrations')
        .select('id, class_level')
        .eq('event_id', eventIdToFetch);

      // Fetch all votes with scores
      const { data: votes } = await supabase
        .from('votes')
        .select('registration_id, user_id, score');

      // Fetch judge user IDs
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const judgeUserIds = new Set(
        (userRoles || [])
          .filter(ur => ur.role === 'judge')
          .map(ur => ur.user_id)
      );

      // Calculate judge scores
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

      // Get entries with judge scores, sorted by average score
      const entriesWithScores = (registrations || [])
        .map(reg => ({
          id: reg.id,
          class_level: (reg as any).class_level as string | null,
          average_score: scoreData[reg.id] ? scoreData[reg.id].total / scoreData[reg.id].count : 0,
          total_reviews: scoreData[reg.id]?.count || 0,
        }))
        .filter(e => e.total_reviews > 0) // Only include those reviewed by judges
        .sort((a, b) => b.average_score - a.average_score);

      // Get balanced top 6 (2 per class level) - these are WINNERS to exclude
      const classLevels = ['Tiny Tales', 'Young Dreamers', 'Story Champions'];
      const top6: typeof entriesWithScores = [];
      
      for (const level of classLevels) {
        const entriesForLevel = entriesWithScores.filter(e => e.class_level === level);
        top6.push(...entriesForLevel.slice(0, 2));
      }
      
      // Fill remaining with top entries if needed
      if (top6.length < 6) {
        const top6Ids = new Set(top6.map(e => e.id));
        const remaining = entriesWithScores.filter(e => !top6Ids.has(e.id));
        top6.push(...remaining.slice(0, 6 - top6.length));
      }

      const top6Ids = new Set(top6.slice(0, 6).map(e => e.id));
      setJudgeTop6Ids(top6Ids);

      // Get next 45 entries after top 6 for community voting
      const remainingAfterTop6 = entriesWithScores.filter(e => !top6Ids.has(e.id));
      const top45ForVoting = remainingAfterTop6.slice(0, 45);
      
      setEligibleForVotingIds(new Set(top45ForVoting.map(e => e.id)));
    } catch (error) {
      console.error('Error fetching judge rankings:', error);
    }
  };

  const fetchContestants = async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, name')
        .eq('id', eventId)
        .single();

      if (eventError || !eventData) {
        setLoading(false);
        return;
      }

      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('id, first_name, last_name, story_title, story_description, age, category, class_level, yt_link, overall_votes, overall_views, city, email, phone, created_at, events:events!registrations_event_id_fkey(name)')
        .eq('event_id', eventId)
        .order('overall_votes', { ascending: false });

      if (error) {
        console.error('Error fetching contestants:', error);
        setLoading(false);
        return;
      }

      const formattedContestants = (registrations || []).map((reg) => ({
        id: reg.id,
        first_name: reg.first_name,
        last_name: reg.last_name,
        story_title: reg.story_title,
        story_description: reg.story_description || '',
        age: reg.age,
        category: reg.category,
        class_level: (reg as any).class_level || null,
        yt_link: reg.yt_link,
        overall_votes: reg.overall_votes || 0,
        overall_views: reg.overall_views || 0,
        photo: `https://api.dicebear.com/8.x/initials/svg?seed=${reg.first_name}${reg.last_name}&backgroundColor=9B1B1B&textColor=ffffff`,
        event_name: (reg.events as any)?.name || eventData.name || 'Unknown Event',
        city: reg.city || '',
        email: reg.email || '',
        phone: reg.phone || '',
        created_at: reg.created_at || '',
      }));

      // Fetch judge rankings to determine eligible participants for voting
      await fetchJudgeRankingsForVoting(eventId);

      setContestants(formattedContestants);
    } catch (error) {
      console.error('Error fetching contestants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContestants();

    if (eventId) {
      // Subscribe to registrations changes (for votes/views updates)
      const registrationsChannel = supabase
        .channel(`voting-registrations-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'registrations',
            filter: `event_id=eq.${eventId}`,
          },
          (payload) => {
            // Update the specific contestant in real-time
            if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
              const updatedReg = payload.new as any;
              setContestants((prev) =>
                prev.map((c) =>
                  c.id === updatedReg.id
                    ? { ...c, overall_votes: updatedReg.overall_votes || 0, overall_views: updatedReg.overall_views || 0 }
                    : c
                )
              );
              // Also update selected contestant if it's the same one
              setSelectedContestant((prev) => 
                prev && prev.id === updatedReg.id 
                  ? { ...prev, overall_votes: updatedReg.overall_votes || 0, overall_views: updatedReg.overall_views || 0 }
                  : prev
              );
            }
          }
        )
        .subscribe();

      // Subscribe to voter_details inserts (for real-time vote tracking)
      const voterChannel = supabase
        .channel(`voter-details-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'voter_details',
          },
          () => {
            // Refetch to get updated counts
            fetchContestants();
          }
        )
        .subscribe();

      // Subscribe to views inserts (for real-time view tracking)
      const viewsChannel = supabase
        .channel(`views-${eventId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'views',
          },
          () => {
            // Refetch to get updated counts
            fetchContestants();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(registrationsChannel);
        supabase.removeChannel(voterChannel);
        supabase.removeChannel(viewsChannel);
      };
    }
  }, [eventId]);

  // Check if voter can vote for this contestant (24-hour cooldown)
  const checkCanVote = async (registrationId: string, phone: string): Promise<{ canVote: boolean; reason?: string }> => {
    if (!phone || phone.length !== 10) {
      return { canVote: true };
    }

    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('voter_details')
        .select('id, created_at')
        .eq('registration_id', registrationId)
        .eq('phone', phone)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking vote status:', error);
        return { canVote: true };
      }

      if (data && data.length > 0) {
        const lastVoteTime = new Date(data[0].created_at);
        const now = new Date();
        const timeDiff = now.getTime() - lastVoteTime.getTime();
        const hoursRemaining = Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (1000 * 60 * 60));
        
        return { 
          canVote: false, 
          reason: `You already voted for this contestant. You can vote again in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}` 
        };
      }

      return { canVote: true };
    } catch (error) {
      console.error('Error checking vote status:', error);
      return { canVote: true };
    }
  };

  // Check vote status and record view when phone changes
  useEffect(() => {
    const checkVoteStatusAndView = async () => {
      if (selectedContestant && voterPhone.length === 10) {
        setCheckingVote(true);
        const status = await checkCanVote(selectedContestant.id, voterPhone);
        setCanVoteStatus(status);
        setCheckingVote(false);
        
        // Record view when valid phone is entered (only once per voter per video)
        if (!hasRecordedView) {
          recordView(selectedContestant.id, voterPhone);
        }
      } else {
        setCanVoteStatus({ canVote: true });
      }
    };
    
    checkVoteStatusAndView();
  }, [voterPhone, selectedContestant, hasRecordedView]);

  // Check if voter already viewed this registration (to prevent spam views)
  const checkHasViewed = async (registrationId: string, phone: string): Promise<boolean> => {
    if (!phone || phone.length !== 10) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('voter_details')
        .select('id')
        .eq('registration_id', registrationId)
        .eq('phone', phone)
        .limit(1);

      if (error) {
        console.error('Error checking view status:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking view status:', error);
      return false;
    }
  };

  // Record view only if voter hasn't viewed this registration before
  const recordView = async (registrationId: string, phone: string) => {
    if (!phone || phone.length !== 10) return;

    // Check if already viewed by this phone number using voter_details
    const alreadyViewed = await checkHasViewed(registrationId, phone);
    if (alreadyViewed) {
      console.log('View already recorded for this voter');
      setHasRecordedView(true);
      return;
    }

    try {
      await supabase.from('views').insert({
        registration_id: registrationId,
        user_id: null,
        ip_address: phone, // Store phone as identifier for view tracking
      });
      setHasRecordedView(true);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleContestantClick = async (contestant: Contestant) => {
    setSelectedContestant(contestant);
    setIsModalOpen(true);
    setVoterName('');
    setVoterPhone('');
    setCanVoteStatus({ canVote: true });
    setHasRecordedView(false);
  };

  const handleVote = async () => {
    if (!selectedContestant || !eventId) return;
    
    if (!voterName.trim() || !voterPhone.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your name and phone number to vote.',
        variant: 'destructive',
      });
      return;
    }

    // Validate phone (should be 10 digits)
    const phoneDigits = voterPhone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number.',
        variant: 'destructive',
      });
      return;
    }

    // Check 24-hour cooldown from database
    const voteCheck = await checkCanVote(selectedContestant.id, phoneDigits);
    if (!voteCheck.canVote) {
      toast({
        title: 'Cannot Vote Yet',
        description: voteCheck.reason || 'You need to wait 24 hours before voting again.',
        variant: 'destructive',
      });
      return;
    }

    setVoting(true);

    try {
      // 1. Insert voter details into voter_details table
      const { error: voterError } = await supabase.from('voter_details').insert({
        name: voterName.trim(),
        phone: phoneDigits,
        registration_id: selectedContestant.id,
      });

      if (voterError) {
        throw voterError;
      }

      // 2. Increment vote count in registrations table
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ overall_votes: (selectedContestant.overall_votes || 0) + 1 })
        .eq('id', selectedContestant.id);

      if (updateError) {
        throw updateError;
      }

      // 3. Send webhook notification
      try {
        await fetch('https://kamalesh-tech-aiii.app.n8n.cloud/webhook/voter-whatsapp notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: voterName.trim(),
            phone: phoneDigits,
            yt_link: selectedContestant.yt_link || '',
          }),
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail the vote if webhook fails
      }

      // Update local state
      setContestants((prev) =>
        prev.map((c) =>
          c.id === selectedContestant.id
            ? { ...c, overall_votes: (c.overall_votes || 0) + 1 }
            : c
        )
      );

      toast({
        title: 'Vote Recorded! 🎉',
        description: `Thank you for voting for ${selectedContestant.first_name} ${selectedContestant.last_name}!`,
      });

      setIsModalOpen(false);
      setVoterName('');
      setVoterPhone('');
      setCanVoteStatus({ canVote: true });
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: 'Vote Failed',
        description: 'Could not record your vote. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setVoting(false);
    }
  };

  const handleShare = () => {
    if (!selectedContestant || !eventId) return;
    setIsShareModalOpen(true);
  };

  const getShareUrl = () => {
    if (!selectedContestant || !eventId) return '';
    return `${window.location.origin}/voting/${eventId}?contestant=${selectedContestant.id}`;
  };

  const getShareText = () => {
    if (!selectedContestant) return '';
    return `Check out this amazing story: ${selectedContestant.story_title} by ${selectedContestant.first_name} ${selectedContestant.last_name}. Vote now!`;
  };

  const copyToClipboard = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      toast({
        title: 'Link Copied!',
        description: 'Voting link has been copied to clipboard.',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }).catch(() => {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy link. Please try again.',
        variant: 'destructive',
      });
    });
  };

  const shareOnWhatsApp = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareOnFacebook = () => {
    const shareUrl = getShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnInstagram = () => {
    copyToClipboard();
    toast({
      title: 'Link Copied!',
      description: 'Instagram doesn\'t support direct sharing. The link has been copied to your clipboard. You can paste it in your Instagram story or post.',
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContestant(null);
    setVoterName('');
    setVoterPhone('');
    setCanVoteStatus({ canVote: true });
    setHasRecordedView(false);
  };

  // Handle phone input - only allow 10 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 10) {
      setVoterPhone(digits);
    }
  };

  // Check if contestant was shared via URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const contestantId = urlParams.get('contestant');
    if (contestantId && contestants.length > 0) {
      const contestant = contestants.find(c => c.id === contestantId);
      if (contestant) {
        handleContestantClick(contestant);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [contestants]);

  // Check if URL is a YouTube URL
  const isYouTubeUrl = (url: string | null): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    
    // Already an embed URL
    if (url.includes('/embed/')) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    let videoId = null;
    
    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }
    
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) {
      videoId = watchMatch[1];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading contestants...</p>
        </div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            No Event Selected
          </h1>
          <p className="text-muted-foreground mb-8">
            Please select an event to view contestants and vote.
          </p>
          <Link to="/events">
            <Button variant="hero">
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (contestants.length === 0) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            No Contestants Yet
          </h1>
          <p className="text-muted-foreground mb-8">
            There are no contestants registered for this event yet. Check back later!
          </p>
          <Link to="/events">
            <Button variant="hero">
              Browse Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show message if judges haven't voted yet
  if (contestants.length > 0 && eligibleForVotingIds.size === 0) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Voting Not Open Yet
          </h1>
          <p className="text-muted-foreground mb-8">
            Judges are currently reviewing submissions. Community voting will open after judges complete their evaluations.
          </p>
          <Link to="/leaderboard">
            <Button variant="hero">
              View Leaderboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Filter contestants - exclude judge top 6 and apply search query
  const filteredContestants = contestants.filter((contestant) => {
    // Only show contestants that are in the top 45 from judge rankings (excluding top 6 winners)
    // If no judge votes yet, show nothing (judges must vote first)
    if (eligibleForVotingIds.size === 0) return false;
    if (!eligibleForVotingIds.has(contestant.id)) return false;
    
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      contestant.first_name.toLowerCase().includes(query) ||
      contestant.last_name.toLowerCase().includes(query) ||
      contestant.story_title.toLowerCase().includes(query) ||
      contestant.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <section className="pt-20 pb-8 sm:pb-12 bg-gradient-warm relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className={cn(
                "group relative backdrop-blur-xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/20",
                "rounded-2xl px-4 py-3 shadow-lg hover:shadow-2xl transition-all duration-300",
                "hover:scale-105 hover:border-primary/50 flex items-center gap-2",
                "bg-primary/10 hover:bg-primary/20 border-primary/30 hover:border-primary/50"
              )}
            >
              <ArrowLeft className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
              <span className="font-medium text-primary group-hover:text-primary-foreground transition-colors">
                Back
              </span>
            </button>
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              Vote for Your <span className="text-gradient">Favorites</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Support young storytellers by voting for the stories that inspire you the most
            </p>
          </div>
        </div>
      </section>

      {/* Search Box */}
      <section className="py-4 sm:py-6 container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search contestants by name, story title, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full h-12 bg-background/80 backdrop-blur-sm border-border/60 focus:bg-background shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Contestants Grid */}
      <section className="py-6 sm:py-12 container mx-auto px-4">
        {filteredContestants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchQuery.trim() ? 'No contestants found matching your search.' : 'No contestants available.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {filteredContestants.map((contestant, index) => (
              <button
                key={contestant.id}
                onClick={() => handleContestantClick(contestant)}
                className={cn(
                  'group relative aspect-square rounded-2xl overflow-hidden',
                  'backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10',
                  'shadow-lg hover:shadow-2xl transition-all duration-300',
                  'hover:scale-105 animate-fade-in'
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Profile Photo */}
                <div className="absolute inset-0">
                  <img
                    src={contestant.photo}
                    alt={`${contestant.first_name} ${contestant.last_name}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Name Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-semibold text-sm truncate">
                    {contestant.first_name} {contestant.last_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{contestant.overall_votes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-white" />
                      <span className="text-white text-xs">{contestant.overall_views}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Modal */}
      {isModalOpen && selectedContestant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" style={{ top: 0 }}>
          <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border/50 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-background transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="p-6 space-y-6">
              {/* Video Player */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                {selectedContestant.yt_link ? (
                  isYouTubeUrl(selectedContestant.yt_link) ? (
                    <iframe
                      src={getYouTubeEmbedUrl(selectedContestant.yt_link) || ''}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={selectedContestant.yt_link}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay={false}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Video coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contestant Info */}
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {selectedContestant.first_name} {selectedContestant.last_name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground mb-4">
                  <span>Age {selectedContestant.age}</span>
                  <span>•</span>
                  <span>{selectedContestant.category}</span>
                  {selectedContestant.city && (
                    <>
                      <span>•</span>
                      <span>{selectedContestant.city}</span>
                    </>
                  )}
                  {selectedContestant.event_name && (
                    <>
                      <span>•</span>
                      <span className="text-primary font-medium">{selectedContestant.event_name}</span>
                    </>
                  )}
                </div>
                <p className="text-foreground mb-2">
                  <span className="font-semibold">Story:</span> {selectedContestant.story_title}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedContestant.story_description}
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{selectedContestant.overall_votes} votes</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>{selectedContestant.overall_views} views</span>
                  </div>
                </div>
              </div>

              {/* Voter Details */}
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
                <h3 className="font-display text-xl font-semibold text-foreground mb-6">
                  Enter Your Details to Vote
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <User className="w-4 h-4" />
                      Your Name
                    </Label>
                    <Input
                      placeholder="Enter your name"
                      value={voterName}
                      onChange={(e) => setVoterName(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-medium text-foreground">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-medium text-foreground">+91</span>
                      </div>
                      <Input
                        type="tel"
                        placeholder="98765 43210"
                        value={voterPhone}
                        onChange={handlePhoneChange}
                        className="pl-20 w-full"
                        maxLength={10}
                        required
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter your 10-digit mobile number
                    </p>
                  </div>
                  {checkingVote && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Checking vote status...</span>
                    </div>
                  )}
                  {!checkingVote && !canVoteStatus.canVote && canVoteStatus.reason && (
                    <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive">
                        {canVoteStatus.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="hero"
                  onClick={handleVote}
                  disabled={voting || !voterName.trim() || voterPhone.length !== 10 || !canVoteStatus.canVote}
                  className="flex-1"
                >
                  {voting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Voting...
                    </>
                  ) : !canVoteStatus.canVote ? (
                    <>
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Already Voted
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      Vote Now
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShare}
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share This Story</DialogTitle>
            <DialogDescription>
              Share this amazing story with your friends and family
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Share Link Input */}
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-2 h-12"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-5 h-5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={shareOnWhatsApp}
                className="flex items-center justify-center gap-2 h-12 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800"
              >
                <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                WhatsApp
              </Button>

              <Button
                variant="outline"
                onClick={shareOnFacebook}
                className="flex items-center justify-center gap-2 h-12 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
              >
                <Facebook className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Facebook
              </Button>

              <Button
                variant="outline"
                onClick={shareOnInstagram}
                className="flex items-center justify-center gap-2 h-12 bg-pink-50 hover:bg-pink-100 dark:bg-pink-950 dark:hover:bg-pink-900 border-pink-200 dark:border-pink-800"
              >
                <Instagram className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                Instagram
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Voting;
