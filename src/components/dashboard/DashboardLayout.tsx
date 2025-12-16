import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  requiredRole: 'user' | 'judge' | 'admin';
}

export const DashboardLayout = ({ requiredRole }: DashboardLayoutProps) => {
  const { isAuthenticated, role } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  if (!isAuthenticated) {
    return <Navigate to={`/${requiredRole}`} replace />;
  }

  if (role !== requiredRole) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        collapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobile={isMobile}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div
        className={`transition-all duration-300 ${
          isMobile
            ? 'ml-0'
            : isSidebarCollapsed
            ? 'ml-20'
            : 'ml-64'
        }`}
      >
        <DashboardHeader 
          onMenuClick={() => setIsMobileMenuOpen(true)}
          isMobile={isMobile}
        />
        <main className="p-4 sm:p-6 md:p-8 lg:p-10 page-enter w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
