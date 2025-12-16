import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Settings, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
interface DashboardHeaderProps {
  onMenuClick?: () => void;
  isMobile?: boolean;
}
export const DashboardHeader = ({
  onMenuClick,
  isMobile = false
}: DashboardHeaderProps) => {
  const {
    user,
    role
  } = useAuth();
  const {
    language: globalLanguage,
    setLanguage: setGlobalLanguage
  } = usePreferences();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'notifications' | 'display' | 'account'>('general');
  const [language, setLanguage] = useState<'English' | 'Tamil'>(globalLanguage === 'ta' ? 'Tamil' : 'English');
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  return <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {isMobile && onMenuClick && <button onClick={onMenuClick} className="p-2 rounded-xl hover:bg-muted transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>}
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            
          </Link>
        </div>
        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Settings */}
          <button className="p-2 rounded-xl hover:bg-muted transition-colors" onClick={() => setSettingsOpen(true)}>
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Profile – direct link to profile page */}
          <button onClick={() => navigate(`/${role}/dashboard/profile`)} className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl hover:bg-muted transition-colors">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-primary/20">
              <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
              <AvatarFallback className={cn('font-semibold text-sm sm:text-base', role === 'admin' ? 'bg-red text-red-foreground' : role === 'judge' ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground')}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start">
            {/* Left menu */}
            <div className="w-full sm:w-40 border-b sm:border-b-0 sm:border-r border-border pb-4 sm:pb-0 sm:pr-4 space-y-1 text-sm flex sm:flex-col flex-row gap-2 overflow-x-auto">
              {[{
              id: 'general',
              label: 'General'
            }, {
              id: 'notifications',
              label: 'Notifications'
            }, {
              id: 'display',
              label: 'Display'
            }, {
              id: 'account',
              label: 'Account'
            }].map(item => <button key={item.id} className={`w-full sm:w-full text-left px-3 py-2 rounded-md transition-colors whitespace-nowrap ${activeSection === item.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`} onClick={() => setActiveSection(item.id as typeof activeSection)}>
                  {item.label}
                </button>)}
            </div>

            {/* Right content */}
            <div className="flex-1 space-y-4 text-sm">
              {activeSection === 'general' && <>
                  <h3 className="font-semibold text-foreground">General</h3>
                  <p className="text-xs text-muted-foreground">
                    Basic preferences for your Story Seed dashboard.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Language</p>
                        <p className="text-xs text-muted-foreground">
                          Currently set to {language}.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                    const next = language === 'English' ? 'Tamil' : 'English';
                    setLanguage(next);
                    setGlobalLanguage(next === 'English' ? 'en' : 'ta');
                    toast({
                      title: 'Language updated',
                      description: `Interface language set to ${next}.`
                    });
                  }}>
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Email updates</p>
                        <p className="text-xs text-muted-foreground">
                          Receive important updates about events and results.
                        </p>
                      </div>
                      <Switch checked={emailUpdates} onCheckedChange={checked => {
                    setEmailUpdates(!!checked);
                    toast({
                      title: 'Email updates',
                      description: checked ? 'You will receive important updates.' : 'Email updates turned off.'
                    });
                  }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Auto-play animations</p>
                        <p className="text-xs text-muted-foreground">
                          Play subtle animations on dashboard cards.
                        </p>
                      </div>
                      <Switch checked={compactLayout} onCheckedChange={checked => {
                    setCompactLayout(!!checked);
                    toast({
                      title: 'Dashboard animations',
                      description: checked ? 'Animations enabled.' : 'Animations disabled.'
                    });
                  }} />
                    </div>
                  </div>
                </>}

              {activeSection === 'notifications' && <>
                  <h3 className="font-semibold text-foreground">
                    Notifications
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Control how you&apos;re notified about events, votes and
                    results.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Email notifications</p>
                        <p className="text-xs text-muted-foreground">
                          Get emails when registrations open or results are
                          announced.
                        </p>
                      </div>
                      <Switch checked={emailNotifications} onCheckedChange={checked => {
                    setEmailNotifications(!!checked);
                    toast({
                      title: 'Email notifications',
                      description: checked ? 'Email notifications enabled.' : 'Email notifications disabled.'
                    });
                  }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">In-app alerts</p>
                        <p className="text-xs text-muted-foreground">
                          Show reminders about upcoming deadlines.
                        </p>
                      </div>
                      <Switch checked={inAppAlerts} onCheckedChange={checked => {
                    setInAppAlerts(!!checked);
                    toast({
                      title: 'In-app alerts',
                      description: checked ? 'You will see deadline reminders.' : 'In-app alerts muted.'
                    });
                  }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          Weekly summary email
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Get a weekly summary of your submissions and votes.
                        </p>
                      </div>
                      <Switch checked={weeklySummary} onCheckedChange={checked => {
                    setWeeklySummary(!!checked);
                    toast({
                      title: 'Weekly summary',
                      description: checked ? 'Weekly summary enabled.' : 'Weekly summary disabled.'
                    });
                  }} />
                    </div>
                  </div>
                </>}

              {activeSection === 'display' && <>
                  <h3 className="font-semibold text-foreground">Display</h3>
                  <p className="text-xs text-muted-foreground">
                    Adjust how information is shown in your dashboard.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Compact layout</p>
                        <p className="text-xs text-muted-foreground">
                          Reduce padding on cards to see more content at once.
                        </p>
                      </div>
                      <Switch checked={compactLayout} onCheckedChange={checked => {
                    setCompactLayout(!!checked);
                    toast({
                      title: 'Layout updated',
                      description: checked ? 'Compact layout enabled.' : 'Compact layout disabled.'
                    });
                  }} />
                    </div>
                  </div>
                </>}

              {activeSection === 'account' && <>
                  <h3 className="font-semibold text-foreground">Account</h3>
                  <p className="text-xs text-muted-foreground">
                    Manage your Story Seed account details.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Profile</p>
                        <p className="text-xs text-muted-foreground">
                          Update your name, school and contact information.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => {
                    setSettingsOpen(false);
                    navigate(`/${role}/dashboard/profile`);
                  }}>
                        Open profile
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Security</p>
                        <p className="text-xs text-muted-foreground">
                          Change your password or sign out from all devices.
                        </p>
                      </div>
                      <Switch checked={rememberDevice} onCheckedChange={checked => {
                    setRememberDevice(!!checked);
                    toast({
                      title: 'Security setting',
                      description: checked ? 'This device will be remembered.' : 'This device will not be remembered.'
                    });
                  }} />
                    </div>
                  </div>
                </>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>;
};