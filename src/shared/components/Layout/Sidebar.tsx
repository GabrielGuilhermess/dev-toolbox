import { useState, type ReactElement } from 'react';
import { Database, FileStack, Wrench, Search, X, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router';
import { Button } from '@/shared/components/ui';
import { categories, toolRegistry } from '@/shared/constants';
import type { ToolCategory } from '@/shared/types';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryIcons: Record<ToolCategory, LucideIcon> = {
  documents: FileStack,
  data: Database,
  utilities: Wrench,
};

export default function Sidebar({ isOpen, onClose }: SidebarProps): ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const normalizedSearch = searchTerm.trim().toLowerCase();

  return (
    <>
      <button
        aria-label="Fechar menu lateral"
        className={`fixed inset-0 z-30 bg-slate-950/60 transition-opacity md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        type="button"
      />

      <aside
        aria-label="Navegação de ferramentas"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl shadow-black/15 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-[var(--color-primary)]" />
            <span className="text-base font-semibold tracking-tight">Dev Toolbox</span>
          </div>

          <Button
            aria-label="Fechar menu"
            className="md:hidden"
            onClick={onClose}
            size="sm"
            type="button"
            variant="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="shrink-0 border-b border-[var(--color-border)] px-3 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
            <input
              aria-label="Buscar ferramenta"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-inset)] px-9 py-3 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
              onChange={(event) => {
                setSearchTerm(event.target.value);
              }}
              placeholder="Buscar ferramenta..."
              type="search"
              value={searchTerm}
            />
          </div>
        </div>

        <nav aria-label="Categorias de ferramentas" className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              const tools = toolRegistry.filter((tool) => {
                const matchesCategory = tool.category === category.id;
                const matchesSearch =
                  normalizedSearch.length === 0 ||
                  tool.name.toLowerCase().includes(normalizedSearch);

                return matchesCategory && matchesSearch;
              });

              if (tools.length === 0) {
                return null;
              }

              return (
                <section key={category.id} className="space-y-1">
                  <div className="flex items-center gap-2 px-2 pb-1">
                    <div className="rounded-lg bg-[var(--color-primary-subtle)] p-1.5 text-[var(--color-primary)]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
                      {category.name}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {tools.map((tool) => {
                      const ToolIcon = tool.icon;

                      return (
                        <NavLink
                          key={tool.id}
                          onClick={onClose}
                          to={tool.path}
                          className={({ isActive }) =>
                            [
                              'flex min-h-[2.75rem] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150',
                              isActive
                                ? 'bg-[var(--color-primary-muted)] font-semibold text-[var(--color-primary)]'
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]',
                            ].join(' ')
                          }
                        >
                          <ToolIcon className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 truncate">{tool.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {categories.every((category) =>
              toolRegistry.every((tool) => {
                const matchesCategory = tool.category === category.id;
                const matchesSearch =
                  normalizedSearch.length === 0 ||
                  tool.name.toLowerCase().includes(normalizedSearch);

                return !matchesCategory || !matchesSearch;
              }),
            ) ? (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-sm text-[var(--color-text-muted)]">
                Nenhuma ferramenta encontrada.
              </div>
            ) : null}
          </div>
        </nav>
      </aside>
    </>
  );
}
