import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, X, Check, Trophy, Lock, Unlock, Upload, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Participant {
  id: string;
  first_name: string;
  last_name: string;
  story_title: string;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  banner_image: string | null;
  winner_id: string | null;
  runner_up_id: string | null;
  second_runner_up_id: string | null;
  results_announced: boolean | null;
  registration_open: boolean | null;
  is_payment_enabled: boolean | null;
  qr_code_url: string | null;
  participantCount?: number;
  voteCount?: number;
}

const AdminCompetitions = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [winnersDialog, setWinnersDialog] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winnerSelections, setWinnerSelections] = useState({
    winner_id: '',
    runner_up_id: '',
    second_runner_up_id: '',
  });
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const eventsWithCounts = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { count: participantCount } = await supabase
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          const { data: registrations } = await supabase
            .from('registrations')
            .select('overall_votes')
            .eq('event_id', event.id);

          const voteCount = registrations?.reduce((sum, r) => sum + (r.overall_votes || 0), 0) || 0;

          return {
            ...event,
            participantCount: participantCount || 0,
            voteCount,
          };
        })
      );

      setEvents(eventsWithCounts as unknown as Event[]);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async (eventId: string) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('id, first_name, last_name, story_title')
      .eq('event_id', eventId)
      .order('overall_votes', { ascending: false });

    if (!error && data) {
      setParticipants(data);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatus = (event: Event) => {
    if (!event.is_active) return 'Draft';
    const now = new Date();
    const start = event.start_date ? new Date(event.start_date) : null;
    const end = event.end_date ? new Date(event.end_date) : null;

    if (start && now < start) return 'Upcoming';
    if (end && now > end) return 'Ended';
    return 'Live';
  };

  const handleUpdate = async () => {
    if (!editEvent) return;

    try {
      let qrCodeUrl = editEvent.qr_code_url;

      // Upload QR code if a new file is selected
      if (qrCodeFile) {
        setUploadingQr(true);
        const fileExt = qrCodeFile.name.split('.').pop();
        const fileName = `qr-${editEvent.id}-${Date.now()}.${fileExt}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('payment-qr-codes')
          .upload(fileName, qrCodeFile, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('payment-qr-codes')
          .getPublicUrl(fileName);

        qrCodeUrl = urlData.publicUrl;
        setUploadingQr(false);
      }

      // If payment is disabled, clear the QR code URL
      if (!editEvent.is_payment_enabled) {
        qrCodeUrl = null;
      }

      const { error } = await supabase
        .from('events')
        .update({
          name: editEvent.name,
          description: editEvent.description,
          start_date: editEvent.start_date,
          end_date: editEvent.end_date,
          is_active: editEvent.is_active,
          is_payment_enabled: editEvent.is_payment_enabled,
          qr_code_url: qrCodeUrl,
        })
        .eq('id', editEvent.id);

      if (error) throw error;

      toast({ title: 'Event Updated', description: 'Competition has been updated successfully.' });
      setEditEvent(null);
      setQrCodeFile(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setUploadingQr(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;

      toast({ title: 'Event Deleted', description: 'Competition has been deleted.' });
      setDeleteConfirm(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const openWinnersDialog = async (event: Event) => {
    setWinnersDialog(event);
    setWinnerSelections({
      winner_id: event.winner_id || '',
      runner_up_id: event.runner_up_id || '',
      second_runner_up_id: event.second_runner_up_id || '',
    });
    await fetchParticipants(event.id);
  };

  const handleAnnounceWinners = async () => {
    if (!winnersDialog) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({
          winner_id: winnerSelections.winner_id && winnerSelections.winner_id !== 'none' ? winnerSelections.winner_id : null,
          runner_up_id: winnerSelections.runner_up_id && winnerSelections.runner_up_id !== 'none' ? winnerSelections.runner_up_id : null,
          second_runner_up_id: winnerSelections.second_runner_up_id && winnerSelections.second_runner_up_id !== 'none' ? winnerSelections.second_runner_up_id : null,
          results_announced: true,
        })
        .eq('id', winnersDialog.id);

      if (error) throw error;

      toast({ title: 'Winners Announced!', description: 'Results are now visible to participants.' });
      setWinnersDialog(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleRegistration = async (eventId: string, isCurrentlyOpen: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ registration_open: !isCurrentlyOpen })
        .eq('id', eventId);

      if (error) throw error;

      toast({
        title: isCurrentlyOpen ? 'Registration Closed' : 'Registration Opened',
        description: isCurrentlyOpen
          ? 'Participants can no longer register for this event.'
          : 'Participants can now register for this event.',
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
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
      <h1 className="font-display text-2xl font-bold text-foreground">Manage Competitions</h1>

      {events.length === 0 ? (
        <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
          <p className="text-muted-foreground">No competitions created yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-foreground">Competition</th>
                  <th className="text-left p-4 font-medium text-foreground">Participants</th>
                  <th className="text-left p-4 font-medium text-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const status = getStatus(event);
                  return (
                    <tr key={event.id} className="border-t border-border/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{event.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {event.results_announced && (
                              <span className="text-xs text-green-600 flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> Results announced
                              </span>
                            )}
                            {event.is_payment_enabled && (
                              <span className="text-xs text-blue-600 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" /> Payment enabled
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">{event.participantCount?.toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'Live' ? 'bg-green-100 text-green-700' :
                          status === 'Upcoming' ? 'bg-yellow-100 text-yellow-700' :
                            status === 'Ended' ? 'bg-red-100 text-red-700' :
                              'bg-muted text-muted-foreground'
                          }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(event)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditEvent(event)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={event.registration_open === false ? "text-red-600" : "text-green-600"}
                            onClick={() => handleToggleRegistration(event.id, event.registration_open !== false)}
                            title={event.registration_open === false ? "Open Registration" : "Close Registration"}
                          >
                            {event.registration_open === false ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="text-yellow-600" onClick={() => openWinnersDialog(event)}>
                            <Trophy className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteConfirm(event.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.banner_image && (
                <img src={selectedEvent.banner_image} alt="Banner" className="w-full h-48 object-cover rounded-lg" />
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Start:</span> {selectedEvent.start_date ? format(new Date(selectedEvent.start_date), 'PPP') : 'Not set'}</div>
                <div><span className="text-muted-foreground">End:</span> {selectedEvent.end_date ? format(new Date(selectedEvent.end_date), 'PPP') : 'Not set'}</div>
                <div><span className="text-muted-foreground">Participants:</span> {selectedEvent.participantCount}</div>
                <div><span className="text-muted-foreground">Total Votes:</span> {selectedEvent.voteCount}</div>
              </div>
              {selectedEvent.description && (
                <p className="text-muted-foreground">{selectedEvent.description}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editEvent} onOpenChange={() => setEditEvent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Competition</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={editEvent.name} onChange={(e) => setEditEvent({ ...editEvent, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={editEvent.start_date?.split('T')[0] || ''}
                    onChange={(e) => setEditEvent({ ...editEvent, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="date"
                    value={editEvent.end_date?.split('T')[0] || ''}
                    onChange={(e) => setEditEvent({ ...editEvent, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editEvent.description || ''}
                  onChange={(e) => setEditEvent({ ...editEvent, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editEvent.is_active || false}
                  onChange={(e) => setEditEvent({ ...editEvent, is_active: e.target.checked })}
                  id="is_active"
                />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>

              {/* Payment Settings */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Payment Settings</h3>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editEvent.is_payment_enabled || false}
                    onChange={(e) => {
                      setEditEvent({ ...editEvent, is_payment_enabled: e.target.checked });
                      if (!e.target.checked) {
                        setQrCodeFile(null);
                      }
                    }}
                    id="is_payment_enabled"
                  />
                  <label htmlFor="is_payment_enabled" className="text-sm font-medium">
                    Enable Payment for Registration
                  </label>
                </div>

                {editEvent.is_payment_enabled && (
                  <div className="space-y-3 pl-7 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Upload QR Code for Payment</label>
                      <div className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setQrCodeFile(file);
                          }}
                          className="hidden"
                          id="qr-upload"
                        />
                        <label htmlFor="qr-upload" className="cursor-pointer">
                          {qrCodeFile ? (
                            <div className="flex items-center justify-center gap-2 text-green-600">
                              <Check className="w-5 h-5" />
                              <span className="text-sm">{qrCodeFile.name}</span>
                            </div>
                          ) : editEvent.qr_code_url ? (
                            <div className="space-y-2">
                              <img src={editEvent.qr_code_url} alt="Current QR" className="w-32 h-32 mx-auto object-contain" />
                              <p className="text-xs text-center text-muted-foreground">Click to change QR code</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-center">
                              <Upload className="w-8 h-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to upload QR code</p>
                              <p className="text-xs text-muted-foreground">PNG, JPG (max 5MB)</p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setEditEvent(null); setQrCodeFile(null); }}>Cancel</Button>
                <Button variant="hero" onClick={handleUpdate} disabled={uploadingQr}>
                  {uploadingQr ? (
                    <>
                      <div className="w-4 h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Winners Dialog */}
      <Dialog open={!!winnersDialog} onOpenChange={() => setWinnersDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Announce Winners
            </DialogTitle>
          </DialogHeader>
          {winnersDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select winners for <strong>{winnersDialog.name}</strong></p>

              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-yellow-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                    Winner (1st Place)
                  </label>
                  <Select
                    value={winnerSelections.winner_id}
                    onValueChange={(value) => setWinnerSelections({ ...winnerSelections, winner_id: value })}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">No winner</SelectItem>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.story_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-bold">2</span>
                    Runner Up (2nd Place)
                  </label>
                  <Select
                    value={winnerSelections.runner_up_id}
                    onValueChange={(value) => setWinnerSelections({ ...winnerSelections, runner_up_id: value })}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select runner up" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">No runner up</SelectItem>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.story_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    Second Runner Up (3rd Place)
                  </label>
                  <Select
                    value={winnerSelections.second_runner_up_id}
                    onValueChange={(value) => setWinnerSelections({ ...winnerSelections, second_runner_up_id: value })}
                  >
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue placeholder="Select second runner up" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="none">No second runner up</SelectItem>
                      {participants.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} - {p.story_title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setWinnersDialog(null)}>Cancel</Button>
                <Button variant="hero" onClick={handleAnnounceWinners}>
                  <Trophy className="w-4 h-4 mr-1" /> Announce Winners
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Competition?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">This action cannot be undone. All related data will be permanently deleted.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCompetitions;
