import { useState, type ReactElement } from 'react';
import {
  Braces,
  ChevronDown,
  ChevronRight,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { Button } from '@/shared/components/ui';
import { categories, toolRegistry } from '@/shared/constants';
import type { ToolCategory } from '@/shared/types';

export interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}

const categoryIcons: Record<ToolCategory, LucideIcon> = {
  documents: FileText,
  data: Braces,
  utilities: Wrench,
};

const initialCategoryState: Record<ToolCategory, boolean> = {
  documents: true,
  data: true,
  utilities: true,
};

export default function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
  onToggleCollapsed,
}: SidebarProps): ReactElement {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] =
    useState<Record<ToolCategory, boolean>>(initialCategoryState);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const toggleCategory = (category: ToolCategory): void => {
    setExpandedCategories((current) => ({ ...current, [category]: !current[category] }));
  };

  const expandFromCategory = (category: ToolCategory): void => {
    setExpandedCategories((current) => ({ ...current, [category]: true }));
    onToggleCollapsed();
  };

  return (
    <>
      <button
        aria-label="Fechar menu lateral"
        className={`fixed inset-0 z-30 bg-black/35 transition-opacity duration-[var(--motion-normal)] md:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        type="button"
      />

      <aside
        aria-label="Navegação de ferramentas"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--divider-section)] bg-[var(--color-bg)] transition-[width,transform] duration-[var(--motion-normal)] ease-[var(--motion-easing)] md:translate-x-0 ${
          isCollapsed ? 'md:w-16' : 'md:w-64'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-14 shrink-0 items-center border-b border-[var(--divider-section)] px-3">
          <NavLink
            aria-label="Ir para o início"
            className="flex min-w-0 flex-1 items-center gap-2 px-1 text-sm font-semibold tracking-tight"
            onClick={onClose}
            to="/"
          >
            <span aria-hidden="true" className="font-mono text-sm font-medium text-[var(--color-primary)]">
              {'</>'}
            </span>
            <span className={isCollapsed ? 'md:hidden' : ''}>DevToolbox</span>
          </NavLink>

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

          <Button
            aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            className="hidden md:inline-flex"
            onClick={onToggleCollapsed}
            size="sm"
            type="button"
            variant="icon"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <div className="shrink-0 border-b border-[var(--divider-item)] p-3">
          {isCollapsed ? (
            <Button
              aria-label="Expandir para buscar ferramenta"
              className="hidden w-full md:inline-flex"
              onClick={onToggleCollapsed}
              size="md"
              type="button"
              variant="icon"
            >
              <Search className="h-4 w-4" />
            </Button>
          ) : null}

          <div className={isCollapsed ? 'md:hidden' : ''}>
            <label className="relative block">
              <span className="sr-only">Buscar ferramenta</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" />
              <input
                aria-label="Buscar ferramenta"
                className="w-full rounded-[var(--radius-control)] border border-[var(--divider-section)] bg-transparent py-2 pl-8 pr-3 text-sm text-[var(--color-text)] outline-none transition-colors duration-[var(--motion-fast)] placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)]"
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder="Buscar ferramenta..."
                type="search"
                value={searchTerm}
              />
            </label>
          </div>
        </div>

        <nav aria-label="Categorias de ferramentas" className="flex-1 overflow-y-auto py-3">
          <div className="space-y-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category.id];
              const tools = toolRegistry.filter((tool) => {
                const matchesCategory = tool.category === category.id;
                const matchesSearch =
                  normalizedSearch.length === 0 ||
                  `${tool.name} ${tool.description}`.toLowerCase().includes(normalizedSearch);
                return matchesCategory && matchesSearch;
              });

              if (tools.length === 0) return null;

              const categoryIsActive = toolRegistry.some(
                (tool) => tool.category === category.id && tool.path === location.pathname,
              );
              const categoryIsExpanded =
                normalizedSearch.length > 0 || expandedCategories[category.id];

              if (isCollapsed) {
                return (
                  <div className="hidden px-2 md:block" key={category.id}>
                    <button
                      aria-label={`Abrir ${category.name}`}
                      className={`flex h-10 w-full items-center justify-center rounded-[var(--radius-control)] transition-colors duration-[var(--motion-fast)] ${
                        categoryIsActive
                          ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)]'
                          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                      }`}
                      onClick={() => {
                        expandFromCategory(category.id);
                      }}
                      title={category.name}
                      type="button"
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </div>
                );
              }

              return (
                <section key={category.id}>
                  <button
                    aria-expanded={categoryIsExpanded}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] transition-colors duration-[var(--motion-fast)] ${
                      categoryIsActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'
                    }`}
                    onClick={() => {
                      toggleCategory(category.id);
                    }}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1">{category.name}</span>
                    {categoryIsExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {categoryIsExpanded ? (
                    <div>
                      {tools.map((tool) => (
                        <NavLink
                          className={({ isActive }) =>
                            `relative flex min-h-10 items-center px-4 pl-9 pr-3 text-sm transition-colors duration-[var(--motion-fast)] ${
                              isActive
                                ? 'font-medium text-[var(--color-primary)] before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:bg-[var(--color-primary)]'
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]'
                            }`
                          }
                          key={tool.id}
                          onClick={onClose}
                          to={tool.path}
                        >
                          <span className="truncate">{tool.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}

            {normalizedSearch.length > 0 &&
            !toolRegistry.some((tool) =>
              `${tool.name} ${tool.description}`.toLowerCase().includes(normalizedSearch),
            ) ? (
              <p className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                Nenhuma ferramenta encontrada.
              </p>
            ) : null}
          </div>
        </nav>
      </aside>
    </>
  );
}
