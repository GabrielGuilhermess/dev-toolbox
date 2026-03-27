// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

function encodeBase64UrlText(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function encodeBase64UrlJson(value: unknown): string {
  return encodeBase64UrlText(JSON.stringify(value));
}

function createJwtToken(header: unknown, payload: unknown, signature = 'c2lnbmF0dXJl'): string {
  return [encodeBase64UrlJson(header), encodeBase64UrlJson(payload), signature].join('.');
}

async function renderJwtDecoderPage(): Promise<ReactElement> {
  const { default: JwtDecoderPage } = await import('./index');

  return createElement(JwtDecoderPage);
}

describe('JwtDecoderPage', () => {
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

  it('carrega a pagina na rota /jwt-decoder via lazy loading', async () => {
    window.history.pushState({}, '', '/jwt-decoder');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'JWT Decoder' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decodificar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('JWT Decoder | Dev Toolbox');
    });
  }, 10000);

  it('decodifica o token e mostra header, payload, signature e highlights', async () => {
    const token = createJwtToken(
      { alg: 'HS256', typ: 'JWT' },
      {
        exp: 4_070_908_800,
        iat: 1_735_689_600,
        iss: 'dev-toolbox',
        sub: 'user-123',
      },
      'c2lnbmF0dXJlLWRldi10b29sYm94',
    );

    render(createElement(ToastProvider, undefined, await renderJwtDecoderPage()));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Token JWT'), {
      target: { value: token },
    });
    fireEvent.click(screen.getByRole('button', { name: /decodificar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Header')).toHaveValue(
        JSON.stringify(
          {
            alg: 'HS256',
            typ: 'JWT',
          },
          null,
          2,
        ),
      );
      expect(screen.getByLabelText<HTMLTextAreaElement>('Payload')).toHaveValue(
        JSON.stringify(
          {
            exp: 4_070_908_800,
            iat: 1_735_689_600,
            iss: 'dev-toolbox',
            sub: 'user-123',
          },
          null,
          2,
        ),
      );
      expect(screen.getByLabelText<HTMLTextAreaElement>('Signature')).toHaveValue(
        'c2lnbmF0dXJlLWRldi10b29sYm94',
      );
      expect(screen.getAllByText('Valido').length).toBeGreaterThan(0);
      expect(screen.getByText('Expiracao')).toBeInTheDocument();
      expect(screen.getByText('Emitido em')).toBeInTheDocument();
      expect(screen.getByText('Subject')).toBeInTheDocument();
      expect(screen.getByText('Issuer')).toBeInTheDocument();
    });
  });

  it('mostra badge de expirado quando o token esta vencido', async () => {
    const token = createJwtToken(
      { alg: 'HS256', typ: 'JWT' },
      { exp: 1, iss: 'dev-toolbox', sub: 'user-expired' },
      'c2lnLWV4cGlyZWQ',
    );

    render(createElement(ToastProvider, undefined, await renderJwtDecoderPage()));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Token JWT'), {
      target: { value: token },
    });
    fireEvent.click(screen.getByRole('button', { name: /decodificar/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Expirado').length).toBeGreaterThan(0);
    });
  });

  it('mostra erro claro para JWT invalido e permite limpar a tela', async () => {
    render(createElement(ToastProvider, undefined, await renderJwtDecoderPage()));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Token JWT'), {
      target: { value: 'abc.def' },
    });
    fireEvent.click(screen.getByRole('button', { name: /decodificar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Erro')).toHaveValue(
        'Erro: Token JWT deve ter 3 partes separadas por ponto.',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Token JWT')).toHaveValue('');
      expect(screen.queryByLabelText('Erro')).not.toBeInTheDocument();
    });
  });
});
