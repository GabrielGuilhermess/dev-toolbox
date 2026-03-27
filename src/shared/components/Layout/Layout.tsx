import { Suspense, useState, type ReactElement } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Outlet } from 'react-router';
import Header from '@/shared/components/Layout/Header';
import Sidebar from '@/shared/components/Layout/Sidebar';

export default function Layout(): ReactElement {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleToggleSidebar = (): void => {
    setIsSidebarOpen((currentValue) => !currentValue);
  };

  const handleCloseSidebar = (): void => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-text)] md:pl-64">
      <Sidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />

      <div className="flex min-h-screen flex-col">
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
          <Suspense
            fallback={
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-sm font-medium shadow-sm">
                  <LoaderCircle className="h-4 w-4 animate-spin text-[var(--color-primary)]" />
                  Carregando ferramenta...
                </div>
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
