import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

type ReviewedEntry = {
  id: string;
  title: string;
  author: string;
  score: number;
  status: string;
  reviewedAt: string;
  eventName: string;
  comment: string | null;
};

const JudgeEntries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ReviewedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviewedEntries = async () => {
    if (!user?.id) return;

    try {
      // Get all votes by this judge
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('id, score, created_at, registration_id, comment')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (votesError) throw votesError;

      if (votes && votes.length > 0) {
        const registrationIds = votes.map(v => v.registration_id);

        // Fetch registration details
        const { data: registrations } = await supabase
          .from('registrations')
          .select('id, story_title, first_name, last_name, event_id')
          .in('id', registrationIds);

        // Fetch event names
        const eventIds = [...new Set(registrations?.map(r => r.event_id).filter(Boolean) || [])];
        const { data: events } = await supabase
          .from('events')
          .select('id, name')
          .in('id', eventIds);

        const eventMap = new Map(events?.map(e => [e.id, e.name]) || []);
        const regMap = new Map(registrations?.map(r => [r.id, r]) || []);

        const reviewedEntries: ReviewedEntry[] = votes.map(v => {
          const reg = regMap.get(v.registration_id);
          return {
            id: v.id,
            title: reg?.story_title || 'Unknown Story',
            author: reg ? `${reg.first_name} ${reg.last_name?.charAt(0)}.` : 'Unknown',
            score: v.score,
            status: v.score >= 5 ? 'Approved' : 'Rejected',
            reviewedAt: v.created_at,
            eventName: reg?.event_id ? eventMap.get(reg.event_id) || 'Unknown Event' : 'Unknown Event',
            comment: (v as any).comment || null
          };
        });

        setEntries(reviewedEntries);
      }
    } catch (error) {
      console.error('Error fetching reviewed entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewedEntries();

    const channel = supabase
      .channel('judge-entries-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        fetchReviewedEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Reviewed Entries</h1>
        <span className="text-sm text-muted-foreground">{entries.length} reviews</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card p-6 rounded-2xl border border-border/50 text-center">
          <p className="text-muted-foreground">You haven't reviewed any entries yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-card p-6 rounded-2xl border border-border/50 card-hover"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {entry.eventName}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {entry.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    By {entry.author} • Score: {entry.score}/10
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reviewed {format(new Date(entry.reviewedAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    entry.status === 'Approved'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {entry.status}
                </span>
              </div>
              {entry.comment && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Your Review Comment:</p>
                  <p className="text-sm text-foreground/80">{entry.comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JudgeEntries;
