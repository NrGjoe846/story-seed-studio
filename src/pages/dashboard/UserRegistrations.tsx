import { useState, useEffect } from 'react';
import { Trophy, Loader2, Video, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Registration {
  id: string;
  story_title: string;
  category: string;
  overall_votes: number;
  created_at: string;
  event_id: string | null;
  event_name?: string;
}

const UserRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      // For anonymous users, show recent registrations
      // In production, you'd track by session ID or email
      const { data: regData, error } = await supabase
        .from('registrations')
        .select('id, story_title, category, overall_votes, created_at, event_id')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && regData) {
        const eventIds = regData.filter(r => r.event_id).map(r => r.event_id);
        let eventMap: Record<string, string> = {};
        
        if (eventIds.length > 0) {
          const { data: eventsData } = await supabase
            .from('events')
            .select('id, name')
            .in('id', eventIds);
          
          if (eventsData) {
            eventMap = eventsData.reduce((acc, e) => ({ ...acc, [e.id]: e.name }), {});
          }
        }

        setRegistrations(
          regData.map(r => ({
            ...r,
            overall_votes: (r as any).overall_votes || 0,
            event_name: r.event_id ? eventMap[r.event_id] : 'Unknown Event',
          }))
        );
      }
      setIsLoading(false);
    };

    fetchRegistrations();

    const channel = supabase
      .channel('user-registrations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registrations',
        },
        () => {
          fetchRegistrations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <h1 className="font-display text-2xl font-bold text-foreground">My Registrations</h1>
      
      {registrations.length === 0 ? (
        <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
          <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            No Registrations Yet
          </h3>
          <p className="text-muted-foreground">
            You haven't registered for any events yet. Start participating!
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {registrations.map((reg) => (
            <div
              key={reg.id}
              className="bg-card p-6 rounded-2xl border border-border/50 card-hover"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {reg.story_title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{reg.event_name}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                  {reg.category}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {reg.overall_votes} votes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Submitted: {new Date(reg.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRegistrations;
