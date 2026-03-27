import type { ReactElement, ReactNode } from 'react';
import { useDocumentTitle } from '@/shared/hooks';
import type { ToolCategory } from '@/shared/types';
import { Badge, Card } from '@/shared/components/ui';

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

const categoryBadgeVariants: Record<ToolCategory, 'info' | 'success' | 'warning'> = {
  documents: 'info',
  data: 'warning',
  utilities: 'success',
};

export default function ToolPage({
  title,
  description,
  category,
  children,
}: ToolPageProps): ReactElement {
  useDocumentTitle(title);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5 px-1 sm:px-2">
      <Card className="border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface-inset)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-3">
          <Badge className="self-start" variant={categoryBadgeVariants[category]}>
            {categoryLabels[category]}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
            {description}
          </p>
        </div>
      </Card>

      <div className="grid gap-5">{children}</div>
    </div>
  );
}
