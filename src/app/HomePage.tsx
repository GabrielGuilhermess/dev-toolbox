import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/shared/components/ui';
import { categories, toolRegistry } from '@/shared/constants';
import { useDocumentTitle } from '@/shared/hooks';

export default function HomePage(): ReactElement {
  useDocumentTitle('Dev Toolbox');

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="bg-[linear-gradient(135deg,rgba(13,148,136,0.15),rgba(15,23,42,0.05))] px-6 py-10 sm:px-8 dark:bg-[linear-gradient(135deg,rgba(45,212,191,0.18),rgba(15,23,42,0.30))]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            Dev Toolbox
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ferramentas rápidas para o dia a dia de desenvolvimento
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
            Navegue pelas categorias e abra qualquer ferramenta sem recarregar a aplicação. Cada
            página é carregada sob demanda, mantendo o shell inicial leve.
          </p>
        </div>
      </section>

      <div className="grid gap-6">
        {categories.map((category) => {
          const tools = toolRegistry.filter((tool) => tool.category === category.id);

          return (
            <section
              key={category.id}
              className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{category.name}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {category.description}
                  </p>
                </div>
                <Badge variant="neutral">
                  {tools.length} {tools.length === 1 ? 'ferramenta' : 'ferramentas'}
                </Badge>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {tools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 transition duration-200 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] hover:shadow-md hover:shadow-black/5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 rounded-xl bg-[var(--color-primary-subtle)] p-2.5 text-[var(--color-primary)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold leading-5 transition group-hover:text-[var(--color-primary)]">
                            {tool.name}
                          </h3>
                          <p className="mt-1.5 text-xs leading-5 text-[var(--color-text-muted)]">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
