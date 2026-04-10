import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { cn } from '@/lib/utils';
import Lenis from 'lenis';

export const MainLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // Global smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Sync with router changes
    lenis.scrollTo(0, { immediate: true });

    return () => {
      lenis.destroy();
    };
  }, [location.pathname]);

  // Fallback scroll-to-top (though handled by Lenis above)
  useEffect(() => {
    if (!isHomePage) window.scrollTo({ top: 0 });
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
