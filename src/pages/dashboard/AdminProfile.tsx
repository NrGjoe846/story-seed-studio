import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileData {
  name: string | null;
  phone: string | null;
  city: string | null;
  bio: string | null;
}

const AdminProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ 
    name: '', 
    phone: '', 
    city: '',
    bio: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone, city, bio')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.name || '',
          phone: profileData.phone || '',
          city: profileData.city || '',
          bio: (profileData as any).bio || '',
        });
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);

    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({ 
          name: profile.name, 
          phone: profile.phone, 
          city: profile.city,
          bio: profile.bio
        } as any)
        .eq('id', user.id);

      toast({ 
        title: 'Profile Updated', 
        description: 'Your profile has been saved successfully.' 
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to save profile.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Admin Profile</h1>
      
      <div className="bg-card p-6 rounded-2xl border border-border/50 space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-red/20">
            <AvatarImage src={user?.avatar} alt={user?.name} />
            <AvatarFallback className="bg-red text-red-foreground font-semibold text-xl">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              {profile.name || user?.name}
            </h2>
            <p className="text-red font-medium">Administrator</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            {user?.id && (
              <p className="text-xs text-muted-foreground mt-1">
                Admin ID: <span className="font-mono font-semibold text-foreground">{user.id}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={profile.name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={user?.email || ''} type="email" disabled />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                value={profile.city || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Mumbai"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <Textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="A short bio about yourself..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <Button variant="hero" className="w-fit" onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </>
        )}
      </Button>
    </div>
  );
};

export default AdminProfile;

