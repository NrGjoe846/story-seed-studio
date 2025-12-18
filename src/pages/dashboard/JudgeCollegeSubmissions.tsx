import { useState, useEffect } from 'react';
import { Eye, Users, Download, FileText, Gauge, MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type CollegeParticipant = {
  id: string;
  name: string;
  storyTitle: string;
  storyDescription: string;
  collegeName: string;
  degree: string;
  branch: string;
  photo: string;
  pdfUrl: string;
  registrationId: string;
  hasVoted: boolean;
};

type CollegeEvent = {
  id: string;
  eventName: string;
  participants: CollegeParticipant[];
  pendingCount: number;
  reviewedCount: number;
};

const JudgeCollegeSubmissions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CollegeEvent | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<CollegeParticipant | null>(null);
  const [voteScore, setVoteScore] = useState([50]);
  const [judgeComment, setJudgeComment] = useState('');

  const fetchCollegeEvents = async () => {
    if (!user?.id) return;

    try {
      // Get all votes by this judge from clg_votes table
      const { data: votes } = await supabase
        .from('clg_votes')
        .select('registration_id')
        .eq('user_id', user.id);

      const votedRegistrationIds = votes?.map(v => v.registration_id) || [];

      // Fetch all college-only events
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, name, event_type')
        .eq('is_active', true)
        .in('event_type', ['college', 'both']);

      if (eventsData) {
        const eventsWithParticipants: CollegeEvent[] = [];

        for (const event of eventsData) {
          // Fetch from clg_registrations table
          const { data: registrations } = await supabase
            .from('clg_registrations')
            .select('id, first_name, last_name, story_title, story_description, pdf_url, college_name, degree, branch')
            .eq('event_id', event.id);

          if (registrations && registrations.length > 0) {
            const participants = registrations.map(p => ({
              id: p.id,
              name: `${p.first_name} ${p.last_name}`,
              storyTitle: p.story_title,
              storyDescription: p.story_description || '',
              collegeName: p.college_name || '',
              degree: p.degree || '',
              branch: p.branch || '',
              photo: `https://api.dicebear.com/8.x/initials/svg?seed=${p.first_name}${p.last_name}`,
              pdfUrl: p.pdf_url || '',
              registrationId: p.id,
              hasVoted: votedRegistrationIds.includes(p.id)
            }));

            eventsWithParticipants.push({
              id: event.id,
              eventName: event.name,
              participants,
              pendingCount: participants.filter(p => !p.hasVoted).length,
              reviewedCount: participants.filter(p => p.hasVoted).length
            });
          }
        }

        setEvents(eventsWithParticipants);
      }
    } catch (error) {
      console.error('Error fetching college events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeEvents();

    const channel = supabase
      .channel('judge-college-submissions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clg_votes' }, () => {
        fetchCollegeEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clg_registrations' }, () => {
        fetchCollegeEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleOpenParticipants = (event: CollegeEvent) => {
    setSelectedEvent(event);
    setIsParticipantsOpen(true);
  };

  const handleOpenReview = (participant: CollegeParticipant) => {
    setSelectedParticipant(participant);
    setIsReviewOpen(true);
    setVoteScore([50]);
    setJudgeComment('');
  };

  const handleDownloadPdf = (url: string, title: string) => {
    if (!url) {
      toast({
        title: 'No PDF Available',
        description: 'This submission does not have a PDF attached.',
        variant: 'destructive'
      });
      return;
    }
    window.open(url, '_blank');
  };

  const handleSubmitVote = async () => {
    if (!user?.id || !selectedParticipant) return;

    const score = Math.round((voteScore[0] / 100) * 10);

    try {
      // Insert into clg_votes table
      const { error } = await supabase.from('clg_votes').insert({
        user_id: user.id,
        registration_id: selectedParticipant.registrationId,
        score,
        comment: judgeComment || null
      });

      if (error) throw error;

      toast({
        title: 'Review Submitted!',
        description: `You gave a score of ${score}/10`
      });

      setIsReviewOpen(false);
      fetchCollegeEvents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">College Event Submissions</h1>
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          <FileText className="w-3 h-3 mr-1" />
          Book Writing
        </Badge>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card p-6 rounded-2xl border border-border/50 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No college events with submissions found.</p>
          <p className="text-sm text-muted-foreground mt-2">College events are for book writing competitions where students submit PDFs.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card p-6 rounded-2xl border border-border/50 card-hover"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {event.eventName}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {event.participants.length} Submissions
                    </Badge>
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                      {event.pendingCount} Pending
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {event.reviewedCount} Reviewed
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenParticipants(event)}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Submissions
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Participants Sheet */}
      <Sheet open={isParticipantsOpen} onOpenChange={setIsParticipantsOpen}>
        <SheetContent side="right" className="bg-background/95 backdrop-blur-lg border-l border-border/60 sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">
              {selectedEvent?.eventName}
            </SheetTitle>
            <SheetDescription>
              {selectedEvent?.participants.length} submission(s) - Book Writing Competition
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {selectedEvent?.participants?.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  participant.hasVoted 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-muted/40 border-border/60'
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={participant.photo} alt={participant.name} />
                  <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{participant.name}</p>
                    {participant.hasVoted && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200">
                        Reviewed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{participant.storyTitle}</p>
                  {participant.collegeName && (
                    <p className="text-xs text-muted-foreground">{participant.collegeName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownloadPdf(participant.pdfUrl, participant.storyTitle)}
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={participant.hasVoted ? 'ghost' : 'outline'}
                    onClick={() => handleOpenReview(participant)}
                    disabled={participant.hasVoted}
                  >
                    {participant.hasVoted ? 'Done' : 'Review'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Review Panel Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-lg border border-border/60">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {selectedParticipant?.storyTitle}
            </DialogTitle>
          </DialogHeader>

          {selectedParticipant && (
            <div className="space-y-6 mt-4">
              {/* Download PDF Button */}
              <div className="flex justify-center">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => handleDownloadPdf(selectedParticipant.pdfUrl, selectedParticipant.storyTitle)}
                  className="gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Book PDF
                </Button>
              </div>

              {/* Participant Details */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedParticipant.photo} alt={selectedParticipant.name} />
                  <AvatarFallback>{selectedParticipant.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-lg">{selectedParticipant.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedParticipant.storyTitle}</p>
                  {selectedParticipant.collegeName && (
                    <p className="text-sm text-muted-foreground">{selectedParticipant.collegeName} - {selectedParticipant.degree}</p>
                  )}
                </div>
              </div>

              {/* Story Description */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <h4 className="font-medium text-foreground mb-2">Book Description</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedParticipant.storyDescription || 'No description provided.'}
                </p>
              </div>

              {/* Judge Comment */}
              <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">Your Review Comment</h4>
                </div>
                <Textarea
                  placeholder="Add your feedback or review comments here..."
                  value={judgeComment}
                  onChange={(e) => setJudgeComment(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Rating Scale */}
              <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <h4 className="font-medium text-foreground">Your Rating</h4>
                </div>
                <div className="space-y-2">
                  <Slider
                    value={voteScore}
                    onValueChange={setVoteScore}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span className="text-2xl font-bold text-primary">
                      {Math.round((voteScore[0] / 100) * 10)}/10
                    </span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={handleSubmitVote}
              >
                Submit Review
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JudgeCollegeSubmissions;