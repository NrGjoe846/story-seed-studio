import { useState, useEffect, useRef } from 'react';
import { Trophy, Calendar, Award, Medal, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import confetti from 'canvas-confetti';

interface EventResult {
  id: string;
  name: string;
  description: string | null;
  end_date: string | null;
  results_announced: boolean;
  winner: { id: string; first_name: string; last_name: string; story_title: string } | null;
  runner_up: { id: string; first_name: string; last_name: string; story_title: string } | null;
  second_runner_up: { id: string; first_name: string; last_name: string; story_title: string } | null;
  userRegistration: { id: string; story_title: string } | null;
  userPosition: 'winner' | 'runner_up' | 'second_runner_up' | 'participant' | null;
}

const UserResults = () => {
  const [results, setResults] = useState<EventResult[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiTriggered = useRef(false);

  const triggerConfetti = () => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FFD700', '#FFDF00'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#FFD700', '#FFDF00'],
      });
    }, 250);
  };

  const fetchResults = async () => {
    try {
      // For anonymous users, show all events with results
      // Get all events with results announced
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('results_announced', true)
        .order('end_date', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch winner details for each event
      const resultsWithWinners = await Promise.all(
        (eventsData || []).map(async (event) => {
          let winner = null;
          let runner_up = null;
          let second_runner_up = null;

          if (event.winner_id) {
            const { data } = await supabase
              .from('registrations')
              .select('id, first_name, last_name, story_title')
              .eq('id', event.winner_id)
              .single();
            winner = data;
          }

          if (event.runner_up_id) {
            const { data } = await supabase
              .from('registrations')
              .select('id, first_name, last_name, story_title')
              .eq('id', event.runner_up_id)
              .single();
            runner_up = data;
          }

          if (event.second_runner_up_id) {
            const { data } = await supabase
              .from('registrations')
              .select('id, first_name, last_name, story_title')
              .eq('id', event.second_runner_up_id)
              .single();
            second_runner_up = data;
          }

          return {
            id: event.id,
            name: event.name,
            description: event.description,
            end_date: event.end_date,
            results_announced: event.results_announced,
            winner,
            runner_up,
            second_runner_up,
            userRegistration: null,
            userPosition: null,
          };
        })
      );

      setResults(resultsWithWinners);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();

    const channel = supabase
      .channel('user-results')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchResults())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getPositionBadge = (position: EventResult['userPosition']) => {
    switch (position) {
      case 'winner':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/20 text-yellow-600 rounded-full text-sm font-medium"><Trophy className="w-4 h-4" /> Winner!</span>;
      case 'runner_up':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-300/30 text-gray-600 rounded-full text-sm font-medium"><Medal className="w-4 h-4" /> 2nd Place</span>;
      case 'second_runner_up':
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600/20 text-amber-700 rounded-full text-sm font-medium"><Award className="w-4 h-4" /> 3rd Place</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm">Participant</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <h1 className="font-display text-2xl font-bold text-foreground">Event Results</h1>

      {results.length === 0 ? (
        <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">You haven't participated in any events yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {results.map((event) => (
            <div
              key={event.id}
              className={`bg-card rounded-2xl border p-6 card-hover ${
                event.results_announced && 
                (event.userPosition === 'winner' || event.userPosition === 'runner_up' || event.userPosition === 'second_runner_up')
                  ? 'border-yellow-500/50 ring-2 ring-yellow-500/20'
                  : 'border-border/50'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-display text-xl font-semibold text-foreground mb-1">
                    {event.name}
                  </h3>
                  {event.end_date && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Ended {format(new Date(event.end_date), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                {event.userPosition && getPositionBadge(event.userPosition)}
              </div>

              {event.userRegistration && (
                <p className="text-sm text-muted-foreground mb-4">
                  Your submission: <span className="font-medium text-foreground">{event.userRegistration.story_title}</span>
                </p>
              )}

              {event.results_announced ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" /> Winners
                  </h4>
                  <div className="grid gap-2">
                    {event.winner && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">1</div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{event.winner.first_name} {event.winner.last_name}</p>
                          <p className="text-sm text-muted-foreground">{event.winner.story_title}</p>
                        </div>
                        <span className="text-yellow-600 font-medium flex items-center gap-1">
                          <Gift className="w-4 h-4" /> Rewarded
                        </span>
                      </div>
                    )}
                    {event.runner_up && (
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
                        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold">2</div>
                        <div>
                          <p className="font-medium text-foreground">{event.runner_up.first_name} {event.runner_up.last_name}</p>
                          <p className="text-sm text-muted-foreground">{event.runner_up.story_title}</p>
                        </div>
                      </div>
                    )}
                    {event.second_runner_up && (
                      <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold">3</div>
                        <div>
                          <p className="font-medium text-foreground">{event.second_runner_up.first_name} {event.second_runner_up.last_name}</p>
                          <p className="text-sm text-muted-foreground">{event.second_runner_up.story_title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/50 rounded-xl text-center">
                  <p className="text-muted-foreground">Results not announced yet</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserResults;