import type { ReactElement } from 'react';
import { Link } from 'react-router';
import { useDocumentTitle } from '@/shared/hooks';

export default function NotFoundPage(): ReactElement {
  useDocumentTitle('Página não encontrada');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center">
      <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center shadow-lg shadow-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
          Erro 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
          O caminho informado não corresponde a nenhuma ferramenta desta aplicação.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] active:scale-[0.98] bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-sm hover:bg-[var(--color-primary-hover)] h-11 px-5 text-sm"
        >
          Voltar para a home
        </Link>
      </div>
    </div>
  );
}
