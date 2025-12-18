import { useState } from 'react';
import { X, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const announcements = [
  { id: 1, text: '🎉 Summer Storytelling Championship 2025 is now LIVE! Register today.', type: 'event' },
  { id: 2, text: '📢 New voting round starts this Friday. Get ready to vote for your favorites!', type: 'alert' },
  { id: 3, text: '✨ Registration for Monsoon Tales Festival is now open!', type: 'registration' },
];

export const AnnouncementBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-hero text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 shimmer" />
      <div className="container mx-auto px-4 max-w-7xl py-2 flex items-center justify-center gap-4 relative">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <p className="text-sm font-medium text-center truncate">
          {currentAnnouncement.text}
        </p>
        <button
          onClick={() => setCurrentIndex((prev) => (prev + 1) % announcements.length)}
          className="text-primary-foreground/80 hover:text-primary-foreground text-xs underline ml-2"
        >
          Next
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-primary-foreground/20 rounded transition-colors"
          aria-label="Close announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
