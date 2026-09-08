import type { ReactElement } from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/shared/components/ui';
import { useTheme } from '@/shared/providers';

export interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps): ReactElement {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <header className="sticky top-0 z-20 h-14 border-b border-[var(--divider-section)] bg-[var(--color-bg)]">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-5 md:px-8 lg:px-10">
        <div className="flex items-center gap-3">
          <Button
            aria-label={isSidebarOpen ? 'Fechar menu lateral' : 'Abrir menu lateral'}
            onClick={onToggleSidebar}
            size="md"
            type="button"
            variant="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link
            to="/"
            className="flex items-center gap-2 text-base font-semibold tracking-tight transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-primary)] md:hidden"
          >
            <span aria-hidden="true" className="font-mono text-sm font-medium text-[var(--color-primary)]">
              {'</>'}
            </span>
            DevToolbox
          </Link>
        </div>

        <Button
          aria-label={isDarkMode ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          onClick={toggleTheme}
          size="md"
          type="button"
          variant="icon"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
