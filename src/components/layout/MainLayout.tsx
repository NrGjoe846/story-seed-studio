import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { cn } from '@/lib/utils';

export const MainLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={cn('flex-1', !isHomePage && 'pt-[120px]')}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};
