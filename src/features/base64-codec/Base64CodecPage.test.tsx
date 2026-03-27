// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderBase64CodecPage(): Promise<ReactElement> {
  const { default: Base64CodecPage } = await import('./index');

  return createElement(Base64CodecPage);
}

describe('Base64CodecPage', () => {
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

  it('carrega a pagina na rota /base64 via lazy loading', async () => {
    window.history.pushState({}, '', '/base64');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'Base64 Encode/Decode' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /executar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Base64 Encode/Decode | Dev Toolbox');
    });
  }, 10000);

  it('codifica, copia, decodifica e limpa o conteudo informado', async () => {
    render(createElement(ToastProvider, undefined, await renderBase64CodecPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('Texto');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(input, {
      target: { value: 'caf\u00E9' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('Y2Fmw6k=');
      expect(screen.getByText('Texto codificado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith('Y2Fmw6k=');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Decodificar' }));

    const decodeInput = screen.getByLabelText<HTMLTextAreaElement>('Base64');

    fireEvent.change(decodeInput, {
      target: { value: '8J+agA==' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('\u{1F680}');
      expect(screen.getByText('Texto decodificado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Base64')).toHaveValue('');
      expect(output).toHaveValue('');
      expect(screen.getByText('Campos limpos.')).toBeInTheDocument();
    });
  });

  it('mostra erro quando o Base64 informado e invalido', async () => {
    render(createElement(ToastProvider, undefined, await renderBase64CodecPage()));

    fireEvent.click(screen.getByRole('button', { name: 'Decodificar' }));

    const input = screen.getByLabelText<HTMLTextAreaElement>('Base64');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(input, {
      target: { value: '!!!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('Erro: Informe um texto Base64 valido.');
      expect(screen.getByText('Informe um texto Base64 valido.')).toBeInTheDocument();
    });
  });
});
