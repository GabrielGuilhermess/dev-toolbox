import type { ReactElement, ReactNode } from 'react';
import { useDocumentTitle } from '@/shared/hooks';
import type { ToolCategory } from '@/shared/types';

export interface ToolPageProps {
  title: string;
  description: string;
  category: ToolCategory;
  children: ReactNode;
}

const categoryLabels: Record<ToolCategory, string> = {
  documents: 'Documentos',
  data: 'Dados',
  utilities: 'Utilitários',
};

export default function ToolPage({
  title,
  description,
  category,
  children,
}: ToolPageProps): ReactElement {
  useDocumentTitle(title);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="border-t border-[var(--divider-section)] pt-6 sm:pt-8">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-primary)]">
          {categoryLabels[category]}
        </p>
        <h1 className="mt-3 text-2xl font-semibold leading-[1.15] tracking-[-0.02em] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
          {description}
        </p>
      </header>

      <div className="grid gap-5 border-t border-[var(--divider-item)] pt-5">{children}</div>
    </div>
  );
}
