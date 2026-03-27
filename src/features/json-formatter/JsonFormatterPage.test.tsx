// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderFormatterPage(): Promise<ReactElement> {
  const { default: JsonFormatterPage } = await import('./index');

  return createElement(JsonFormatterPage);
}

describe('JsonFormatterPage', () => {
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

  it('carrega a pagina na rota /json-formatter via lazy loading', async () => {
    window.history.pushState({}, '', '/json-formatter');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'JSON Formatter' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /executar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('JSON Formatter | Dev Toolbox');
    });
  }, 10000);

  it('formata, copia, minifica e limpa o resultado', async () => {
    render(createElement(ToastProvider, undefined, await renderFormatterPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('JSON');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(input, {
      target: {
        value: '{"name":"Ana","active":true,"items":[1,null,false]}',
      },
    });
    fireEvent.change(screen.getByLabelText('Indentação'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue(
        [
          '{',
          '    "name": "Ana",',
          '    "active": true,',
          '    "items": [',
          '        1,',
          '        null,',
          '        false',
          '    ]',
          '}',
        ].join('\n'),
      );
      expect(screen.getByText('JSON formatado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(output.value);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Minificar' }));

    expect(screen.queryByLabelText('Indentação')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('{"name":"Ana","active":true,"items":[1,null,false]}');
      expect(screen.getByText('JSON minificado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(input).toHaveValue('');
      expect(output).toHaveValue('');
      expect(screen.getByText('Campos limpos.')).toBeInTheDocument();
    });
  });

  it('mostra erro com posicao quando o JSON e invalido', async () => {
    render(createElement(ToastProvider, undefined, await renderFormatterPage()));

    const input = screen.getByLabelText<HTMLTextAreaElement>('JSON');
    const output = screen.getByLabelText<HTMLTextAreaElement>('Resultado');

    fireEvent.change(input, {
      target: { value: '{"a":1,}' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Validar' }));
    fireEvent.click(screen.getByRole('button', { name: /executar/i }));

    await waitFor(() => {
      expect(output).toHaveValue(
        'Erro: Esperava uma chave entre aspas duplas. Erro na posicao 7 (linha 1, coluna 8).',
      );
      expect(
        screen.getByText(
          'Esperava uma chave entre aspas duplas. Erro na posicao 7 (linha 1, coluna 8).',
        ),
      ).toBeInTheDocument();
    });
  });
});
