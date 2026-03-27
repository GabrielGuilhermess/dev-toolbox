// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderUrlCodecPage(): Promise<ReactElement> {
  const { default: UrlCodecPage } = await import('./index');

  return createElement(UrlCodecPage);
}

describe('UrlCodecPage', () => {
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

  it('carrega a pagina na rota /url-codec via lazy loading', async () => {
    window.history.pushState({}, '', '/url-codec');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'URL Encode/Decode' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /executar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('URL Encode/Decode | Dev Toolbox');
    });
  }, 10000);

  it('codifica texto com espacos, decodifica URL e limpa os campos', async () => {
    render(createElement(ToastProvider, undefined, await renderUrlCodecPage()));

    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Texto'), {
      target: { value: 'hello world' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('hello%20world');
      expect(screen.getByText('Texto codificado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith('hello%20world');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Decodificar' }));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Texto codificado'), {
      target: {
        value:
          'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddev%20toolbox%26lang%3Dpt-BR%23secao',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('https://example.com/search?q=dev toolbox&lang=pt-BR#secao');
      expect(screen.getByText('Texto decodificado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Texto codificado')).toHaveValue('');
      expect(output).toHaveValue('');
      expect(screen.getByText('Campos limpos.')).toBeInTheDocument();
    });
  });

  it('mostra erro quando o texto codificado informado e invalido', async () => {
    render(createElement(ToastProvider, undefined, await renderUrlCodecPage()));

    fireEvent.click(screen.getByRole('button', { name: 'Decodificar' }));

    const input = screen.getByLabelText<HTMLTextAreaElement>('Texto codificado');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(input, {
      target: { value: '%E0%A4%A' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('Erro: Informe um texto codificado valido.');
      expect(screen.getByText('Informe um texto codificado valido.')).toBeInTheDocument();
    });
  });
});
