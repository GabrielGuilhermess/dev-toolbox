import type { ReactElement } from 'react';
import { useDocumentTitle } from '@/shared/hooks';

export default function HomePage(): ReactElement {
  useDocumentTitle('Dev Toolbox');

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-5xl items-center">
      <section className="w-full border-t border-[var(--divider-section)] pt-8 sm:pt-10">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-[var(--color-primary)]">
          DevToolbox
        </p>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.15] tracking-[-0.025em] sm:text-4xl">
          Ferramentas para desenvolvimento.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-text-muted)]">
          Um projeto pessoal que reúne utilitários simples para tarefas recorrentes de desenvolvimento,
          organizados para acesso rápido pela navegação lateral.
        </p>

        <div className="mt-10 border-t border-[var(--divider-item)] pt-4 text-sm text-[var(--color-text-muted)]">
          <span className="font-medium text-[var(--color-primary)]">Processamento local.</span>{' '}
          Os dados das ferramentas permanecem no navegador.
        </div>
      </section>
    </div>
  );
}
