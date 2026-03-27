// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderValidatorPage(): Promise<ReactElement> {
  const { default: CpfCnpjValidatorPage } = await import('./index');

  return createElement(CpfCnpjValidatorPage);
}

describe('CpfCnpjValidatorPage', () => {
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

  it('carrega a pagina na rota /cpf-cnpj-validator via lazy loading', async () => {
    window.history.pushState({}, '', '/cpf-cnpj-validator');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'Validador CPF/CNPJ' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Validador CPF/CNPJ | Dev Toolbox');
    });
  }, 10000);

  it('valida um CPF, copia o resultado e limpa a tela', async () => {
    render(createElement(ToastProvider, undefined, await renderValidatorPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('CPF ou CNPJ');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado da validação');

    fireEvent.change(input, {
      target: { value: '123.456.789-09' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    await waitFor(() => {
      expect(output.value).toContain('Tipo detectado: CPF');
      expect(output.value).toContain('CPF formatado: 123.456.789-09');
      expect(output.value).toContain('Status: CPF valido');
      expect(screen.getByText(/^CPF$/u)).toBeInTheDocument();
      expect(screen.getByText('Válido')).toHaveAttribute('data-variant', 'success');
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(output.value);
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(output).toHaveValue('');
      expect(screen.queryByText(/^CPF$/u)).not.toBeInTheDocument();
    });
  });

  it('detecta CNPJ e mostra erro claro para comprimento invalido', async () => {
    render(createElement(ToastProvider, undefined, await renderValidatorPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('CPF ou CNPJ');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado da validação');

    fireEvent.change(input, {
      target: { value: '11.222.333/0001-81' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    await waitFor(() => {
      expect(output.value).toContain('Tipo detectado: CNPJ');
      expect(output.value).toContain('CNPJ formatado: 11.222.333/0001-81');
      expect(output.value).toContain('Status: CNPJ valido');
      expect(screen.getByText(/^CNPJ$/u)).toBeInTheDocument();
      expect(screen.getByText('Válido')).toHaveAttribute('data-variant', 'success');
    });

    fireEvent.change(input, {
      target: { value: '12345' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('');
      expect(screen.queryByText(/^CNPJ$/u)).not.toBeInTheDocument();
    });
  });
});
