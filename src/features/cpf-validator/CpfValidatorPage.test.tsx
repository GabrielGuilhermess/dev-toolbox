// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderValidatorPage(): Promise<ReactElement> {
  const { default: CpfValidatorPage } = await import('./index');

  return createElement(CpfValidatorPage);
}

describe('CpfValidatorPage', () => {
  let clipboardMock: ClipboardMock;

  beforeEach(() => {
    clipboardMock = {
      writeText: vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined),
    };

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: clipboardMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    document.title = '';
  });

  it('carrega a pagina na rota /cpf-validator via lazy loading', async () => {
    window.history.pushState({}, '', '/cpf-validator');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'Validador de CPF' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Validador de CPF | Dev Toolbox');
    });
  }, 10000);

  it('valida um CPF, copia o resultado, mostra status invalido e limpa a tela', async () => {
    render(createElement(ToastProvider, undefined, await renderValidatorPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('CPF');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado da validação');

    fireEvent.change(input, {
      target: { value: '  123.456.789-09  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    await waitFor(() => {
      expect(output.value).toContain('CPF formatado: 123.456.789-09');
      expect(output.value).toContain('Status: CPF valido');
      expect(screen.getByText('CPF valido.')).toBeInTheDocument();
    });

    expect(screen.getByText('Válido')).toHaveAttribute('data-variant', 'success');

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(output.value);
    });

    fireEvent.change(input, {
      target: { value: '123.456.789-00' },
    });

    expect(output).toHaveValue('');
    expect(screen.queryByText('Válido')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    await waitFor(() => {
      expect(output.value).toContain('CPF formatado: 123.456.789-00');
      expect(output.value).toContain('Status: CPF invalido');
      expect(screen.getByText('CPF invalido.')).toBeInTheDocument();
    });

    expect(screen.getByText('Inválido')).toHaveAttribute('data-variant', 'error');

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(output).toHaveValue('');
      expect(screen.queryByText('Inválido')).not.toBeInTheDocument();
      expect(screen.getByText('Campos limpos.')).toBeInTheDocument();
    });
  });

  it('exibe toast de erro quando o CPF nao pode ser validado', async () => {
    render(createElement(ToastProvider, undefined, await renderValidatorPage()));

    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    expect(await screen.findByText('Informe um CPF.')).toBeInTheDocument();
    expect(screen.getByLabelText('Resultado da validação')).toHaveValue('');
    expect(screen.queryByText('Válido')).not.toBeInTheDocument();
    expect(screen.queryByText('Inválido')).not.toBeInTheDocument();
  });
});
