import { usePreferences } from '@/contexts/PreferencesContext';

const translations = {
  en: {
    dashboard: 'Dashboard',
    explore: 'Explore',
    events: 'Events',
    myRegistrations: 'My Registrations',
    myProfile: 'My Profile',
    availableEvents: 'Available Events',
  },
  ta: {
    dashboard: 'டாஷ்போர்ட்',
    explore: 'ஆராய்வு',
    events: 'நிகழ்வுகள்',
    myRegistrations: 'என் பதிவு விவரங்கள்',
    myProfile: 'என் சுயவிபரம்',
    availableEvents: 'கிடைக்கும் நிகழ்வுகள்',
  },
};

export const useT = () => {
  const { language } = usePreferences();
  const current = translations[language];
  return (key: keyof typeof translations['en']) => current[key] || key;
};


