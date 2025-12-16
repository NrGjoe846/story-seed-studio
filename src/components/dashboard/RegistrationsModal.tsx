import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Eye, Trophy, Calendar, MoreVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Registration {
  id: string;
  story_title: string;
  category: string;
  created_at: string;
  event_id: string | null;
  overall_votes: number;
  overall_views: number;
  event_name?: string;
}

interface RegistrationsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistrationsModal = ({ open, onOpenChange }: RegistrationsModalProps) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchRegistrations();
    }
  }, [open]);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const userPhone = localStorage.getItem('story_seed_user_phone');
      if (!userPhone) {
        setIsLoading(false);
        return;
      }

      // Fetch all registrations and filter by phone (last 10 digits match)
      const { data: allRegData, error } = await supabase
        .from('registrations')
        .select('id, story_title, category, overall_votes, overall_views, created_at, event_id, phone, events:events!registrations_event_id_fkey(name)')
        .order('created_at', { ascending: false });

      if (!error && allRegData) {
        // Filter registrations where phone ends with the stored 10 digits
        const regData = allRegData.filter(r => {
          const regPhoneDigits = r.phone.replace(/\D/g, '').slice(-10);
          return regPhoneDigits === userPhone;
        }).slice(0, 50);
        
        setRegistrations(
          regData.map(r => ({
            ...r,
            overall_votes: r.overall_votes || 0,
            overall_views: r.overall_views || 0,
            event_name: (r.events as any)?.name || 'Unknown Event',
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (votes: number) => {
    if (votes >= 50) return 'bg-blue-500';
    if (votes >= 20) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-2xl font-bold text-foreground">
            My Registrations
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12 px-6">
              <p className="text-muted-foreground">No registrations found.</p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden bg-card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Event Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Story Name
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Views
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Votes
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Date Submitted
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="w-12 px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, index) => (
                      <tr
                        key={reg.id}
                        onClick={() => setSelectedRow(selectedRow === reg.id ? null : reg.id)}
                        className={cn(
                          "border-b border-border transition-colors cursor-pointer",
                          selectedRow === reg.id 
                            ? "bg-blue-500 text-white hover:bg-blue-600" 
                            : "hover:bg-muted/30 bg-white dark:bg-card"
                        )}
                      >
                        <td className="px-6 py-4 text-sm">
                          {reg.event_name}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          {reg.story_title}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            {reg.overall_views}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            {reg.overall_votes}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDate(reg.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", getStatusColor(reg.overall_votes))}></div>
                            <span>
                              {reg.overall_votes >= 50 ? 'Popular' : reg.overall_votes >= 20 ? 'Active' : 'New'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 rounded hover:bg-background/20 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

