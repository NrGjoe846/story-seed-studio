import { useState, useEffect } from 'react';
import { Bell, Shield, UserCog, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminSettingsData {
  competition_updates: boolean;
  judge_alerts: boolean;
  user_registrations: boolean;
  two_factor_auth: boolean;
  login_alerts: boolean;
  about: string | null;
}

interface ProfileData {
  name: string | null;
  phone: string | null;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ name: '', phone: '' });
  const [settings, setSettings] = useState<AdminSettingsData>({
    competition_updates: true,
    judge_alerts: true,
    user_registrations: false,
    two_factor_auth: false,
    login_alerts: true,
    about: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          name: profileData.name || '',
          phone: profileData.phone || '',
        });
      }

      // Fetch admin settings
      const { data: settingsData } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setSettings({
          competition_updates: settingsData.competition_updates ?? true,
          judge_alerts: settingsData.judge_alerts ?? true,
          user_registrations: settingsData.user_registrations ?? false,
          two_factor_auth: settingsData.two_factor_auth ?? false,
          login_alerts: settingsData.login_alerts ?? true,
          about: settingsData.about || '',
        });
      }

      setIsLoading(false);
    };

    fetchData();
  }, [user?.id]);

  const handleToggle = (key: keyof AdminSettingsData) => {
    if (typeof settings[key] === 'boolean') {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);

    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({ name: profile.name, phone: profile.phone })
        .eq('id', user.id);

      // Upsert admin settings
      await supabase
        .from('admin_settings')
        .upsert({
          user_id: user.id,
          ...settings,
        }, { onConflict: 'user_id' });

      toast({ title: 'Settings saved', description: 'Your settings were saved successfully.' });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
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
    <div className="space-y-6 page-enter max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your admin profile, notifications, and security.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <section className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-foreground">
            <UserCog className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">Admin Profile</h2>
              <p className="text-sm text-muted-foreground">Update basic details displayed in the dashboard.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <Input
                placeholder="e.g., Madhan Kumar"
                value={profile.name || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email address</label>
              <Input type="email" disabled defaultValue={user?.email || ''} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Role</label>
              <Input disabled defaultValue="Admin" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contact number</label>
              <Input
                placeholder="+91 98765 43210"
                value={profile.phone || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">About</label>
            <Textarea
              value={settings.about || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, about: e.target.value }))}
              placeholder="Share a brief bio or note for the judge/user portals."
              rows={4}
            />
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-foreground">
            <Bell className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Choose what you want to be notified about via email or dashboard alerts.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border border-border/40 rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">Competition updates</p>
                <p className="text-sm text-muted-foreground">Get notified when competitions go live or change status.</p>
              </div>
              <Switch
                checked={settings.competition_updates}
                onCheckedChange={() => handleToggle('competition_updates')}
              />
            </div>
            <div className="flex items-start justify-between gap-4 border border-border/40 rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">Judge alerts</p>
                <p className="text-sm text-muted-foreground">Remind judges about pending reviews or approvals.</p>
              </div>
              <Switch
                checked={settings.judge_alerts}
                onCheckedChange={() => handleToggle('judge_alerts')}
              />
            </div>
            <div className="flex items-start justify-between gap-4 border border-border/40 rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">User registrations</p>
                <p className="text-sm text-muted-foreground">Receive alerts when daily registration targets are met.</p>
              </div>
              <Switch
                checked={settings.user_registrations}
                onCheckedChange={() => handleToggle('user_registrations')}
              />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl border border-border/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-foreground">
            <Shield className="w-6 h-6 text-primary" />
            <div>
              <h2 className="font-display text-xl font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Control login safety and platform access.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 border border-border/40 rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your admin account.</p>
              </div>
              <Switch
                checked={settings.two_factor_auth}
                onCheckedChange={() => handleToggle('two_factor_auth')}
              />
            </div>
            <div className="flex items-start justify-between gap-4 border border-border/40 rounded-xl p-4">
              <div>
                <p className="font-medium text-foreground">Login alerts</p>
                <p className="text-sm text-muted-foreground">Notify me when a new device logs into the admin portal.</p>
              </div>
              <Switch
                checked={settings.login_alerts}
                onCheckedChange={() => handleToggle('login_alerts')}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" variant="hero" className="gap-2" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save settings
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
