import { useState, useEffect } from 'react';
import { Users, Mail, FileText, Search, Loader2, UserCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JudgeData {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
  reviewCount: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
}

const AdminJudges = () => {
  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchJudges = async () => {
    try {
      const { data: judgeRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      if (rolesError) throw rolesError;

      const judgeIds = judgeRoles?.map(r => r.user_id) || [];

      if (judgeIds.length === 0) {
        setJudges([]);
        setLoading(false);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, city, phone')
        .in('id', judgeIds);

      if (profilesError) throw profilesError;

      const judgesWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          return { ...profile, reviewCount: count || 0 };
        })
      );

      setJudges(judgesWithCounts);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data: existingJudges } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'judge');

      const excludeIds = existingJudges?.map(j => j.user_id) || [];

      let query = supabase
        .from('profiles')
        .select('id, name, city, phone')
        .or(`name.ilike.%${term}%,phone.ilike.%${term}%`);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data: profiles, error } = await query.limit(10);
      if (error) throw error;
      setSearchResults(profiles || []);
    } catch (error: any) {
      toast({ title: 'Search Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const addJudge = async (userId: string) => {
    setAddingId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'judge' });

      if (error) throw error;

      toast({ title: 'Judge Added', description: 'User has been promoted to Judge.', variant: 'success' });
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      fetchJudges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setAddingId(null);
    }
  };

  const removeJudge = async (userId: string) => {
    setRemovingId(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'judge');

      if (error) throw error;

      toast({ title: 'Judge Removed', description: 'User role has been revoked.', variant: 'success' });
      fetchJudges();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    fetchJudges();

    const channel = supabase
      .channel('admin-judges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchJudges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchJudges())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm) searchUsers(searchTerm);
      else setSearchResults([]);
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return (
    <div className="space-y-6 page-enter">
      <h1 className="font-display text-2xl font-bold text-foreground">Manage Judges</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Current Judges */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Current Judges ({judges.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-40 bg-card rounded-2xl border border-border/50">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : judges.length === 0 ? (
            <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No judges assigned yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Search for users on the right to add them.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {judges.map((judge) => (
                <div
                  key={judge.id}
                  className="bg-card p-4 rounded-2xl border border-border/50 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{judge.name || 'Unknown Judge'}</h3>
                      <p className="text-muted-foreground text-xs flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {judge.phone || 'No contact'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground text-xs flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {judge.reviewCount} reviews
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      onClick={() => removeJudge(judge.id)}
                      disabled={removingId === judge.id}
                    >
                      {removingId === judge.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: Add Judge */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Add New Judge
          </h2>

          <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-4">
            <p className="text-sm text-muted-foreground">
              Search for a registered user by name or phone number to promote them to the Judge role.
            </p>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            <div className="space-y-2 min-h-[100px]">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary/10 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{user.phone || user.city || 'No details'}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="hero"
                      onClick={() => addJudge(user.id)}
                      disabled={addingId === user.id}
                      className="h-8"
                    >
                      {addingId === user.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : 'Add Judge'}
                    </Button>
                  </div>
                ))
              ) : searchTerm && !isSearching ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No users found matching "{searchTerm}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different name or phone number.</p>
                </div>
              ) : !searchTerm ? (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Start typing to search for users</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminJudges;
