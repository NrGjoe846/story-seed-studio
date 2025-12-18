import { useState, useEffect } from 'react';
import { Users, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface JudgeData {
  id: string;
  name: string | null;
  city: string | null;
  phone: string | null;
  reviewCount: number;
}

const AdminJudges = () => {
  const [judges, setJudges] = useState<JudgeData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJudges = async () => {
    try {
      // Get users with 'judge' role
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

      // Get profiles for these judges
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, city, phone')
        .in('id', judgeIds);

      if (profilesError) throw profilesError;

      // Get vote counts (as reviews) for each judge
      const judgesWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id);

          return {
            ...profile,
            reviewCount: count || 0,
          };
        })
      );

      setJudges(judgesWithCounts);
    } catch (error) {
      console.error('Error fetching judges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudges();

    const channel = supabase
      .channel('admin-judges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchJudges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchJudges())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => fetchJudges())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex justify-between items-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Manage Judges</h1>
        <Button variant="hero">
          <Users className="w-4 h-4" />
          Add Judge
        </Button>
      </div>

      {judges.length === 0 ? (
        <div className="bg-card p-8 rounded-2xl border border-border/50 text-center">
          <p className="text-muted-foreground">No judges found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {judges.map((judge) => (
            <div 
              key={judge.id} 
              className="bg-card p-6 rounded-2xl border border-border/50 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{judge.name || 'Unknown Judge'}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {judge.phone || 'No contact'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {judge.reviewCount} reviews
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminJudges;
