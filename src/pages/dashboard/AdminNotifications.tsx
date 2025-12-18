import { useState, type ElementType } from 'react';
import { Bell, CheckCircle, Clock, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NotificationCategory = 'all' | 'system' | 'judges' | 'users';

interface NotificationItem {
  id: number;
  title: string;
  description: string;
  time: string;
  category: NotificationCategory;
  unread: boolean;
}

const notificationsSeed: NotificationItem[] = [
  {
    id: 1,
    title: 'New submission received',
    description: '“The Midnight Jungle” has been submitted for the Monsoon Tales Festival.',
    time: '5 mins ago',
    category: 'users',
    unread: true,
  },
  {
    id: 2,
    title: 'Judge feedback pending',
    description: 'Judge Raj has 4 pending reviews for the Summer Championship.',
    time: '12 mins ago',
    category: 'judges',
    unread: true,
  },
  {
    id: 3,
    title: 'Voting round scheduled',
    description: 'Voting for Diwali Story Sparkle starts tomorrow at 9:00 AM.',
    time: '1 hour ago',
    category: 'system',
    unread: false,
  },
  {
    id: 4,
    title: 'Registration milestone reached',
    description: 'We just crossed 2,500 registrations for Monsoon Tales Festival.',
    time: '2 hours ago',
    category: 'system',
    unread: false,
  },
  {
    id: 5,
    title: 'Judge joined',
    description: 'Judge Meera accepted the invite for the Winter Wonder Tales event.',
    time: 'Yesterday',
    category: 'judges',
    unread: false,
  },
];

const filterTabs: { label: string; value: NotificationCategory }[] = [
  { label: 'All', value: 'all' },
  { label: 'System', value: 'system' },
  { label: 'Judges', value: 'judges' },
  { label: 'Users', value: 'users' },
];

const categoryIcons: Record<Exclude<NotificationCategory, 'all'>, ElementType> = {
  system: Bell,
  judges: CheckCircle,
  users: Inbox,
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState(notificationsSeed);
  const [activeTab, setActiveTab] = useState<NotificationCategory>('all');

  const unreadCount = notifications.filter((notif) => notif.unread).length;

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((notif) => notif.category === activeTab);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, unread: false })));
  };

  const toggleRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, unread: !notif.unread } : notif
      )
    );
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            Stay on top of registrations, judges, and platform alerts.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread {unreadCount === 1 ? 'alert' : 'alerts'}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-full border text-sm font-medium transition-colors',
              activeTab === tab.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            No notifications in this category yet.
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const Icon = categoryIcons[notif.category as keyof typeof categoryIcons];
            return (
              <div
                key={notif.id}
                className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center',
                      notif.unread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">{notif.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{notif.time}</span>
                      {notif.unread && (
                        <>
                          <span>•</span>
                          <span className="text-primary font-medium">Unread</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-auto">
                  <Button
                    size="sm"
                    variant={notif.unread ? 'hero' : 'secondary'}
                    onClick={() => toggleRead(notif.id)}
                  >
                    {notif.unread ? 'Mark as read' : 'Mark unread'}
                  </Button>
                  <Button size="sm" variant="ghost">
                    View details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;

