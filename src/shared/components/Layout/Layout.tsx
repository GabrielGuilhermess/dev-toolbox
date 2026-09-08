import { Suspense, useState, type ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Outlet } from 'react-router';
import Header from '@/shared/components/Layout/Header';
import Sidebar from '@/shared/components/Layout/Sidebar';

export default function Layout(): ReactElement {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleToggleSidebar = (): void => {
    setIsSidebarOpen((currentValue) => !currentValue);
  };

  const handleCloseSidebar = (): void => {
    setIsSidebarOpen(false);
  };

  const handleToggleCollapsedSidebar = (): void => {
    setIsSidebarCollapsed((currentValue) => !currentValue);
  };

  return (
    <div
      className={`min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-[padding] duration-[var(--motion-normal)] ease-[var(--motion-easing)] ${
        isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}
    >
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        onToggleCollapsed={handleToggleCollapsedSidebar}
      />

      <div className="flex min-h-screen flex-col">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />

        <main className="flex-1 px-4 py-6 sm:px-5 md:px-8 md:py-8 lg:px-10">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                <span>Carregando ferramenta...</span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
