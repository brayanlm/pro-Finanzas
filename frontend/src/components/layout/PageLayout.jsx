import { cn } from '../../utils/format';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const PageLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved) setSidebarCollapsed(JSON.parse(saved));
  }, []);

  const toggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newValue));
  };

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        className={cn(isMobileSidebarOpen && 'lg:hidden fixed z-50')}
      />
      
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64')}>
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="pt-16 pb-8 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PageLayout;