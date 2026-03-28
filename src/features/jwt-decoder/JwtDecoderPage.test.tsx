// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

vi.mock('./jwt-decoder.logic', async () => {
  const actual = await vi.importActual<typeof import('./jwt-decoder.logic')>('./jwt-decoder.logic');
  return { ...actual, validateJwtSignature: vi.fn() };
});

function encodeBase64UrlText(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function encodeBase64UrlJson(value: unknown): string {
  return encodeBase64UrlText(JSON.stringify(value));
}

function createJwtToken(header: unknown, payload: unknown, signature = 'c2lnbmF0dXJl'): string {
  return [encodeBase64UrlJson(header), encodeBase64UrlJson(payload), signature].join('.');
}

async function renderDecodedPage(token: string): Promise<void> {
  const { default: JwtDecoderPage } = await import('./index');
  render(createElement(ToastProvider, undefined, createElement(JwtDecoderPage)));
  fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Token JWT'), { target: { value: token } });
  fireEvent.click(screen.getByRole('button', { name: /decodificar/i }));
}

async function mockSignatureValidation(
  result: Awaited<ReturnType<(typeof import('./jwt-decoder.logic'))['validateJwtSignature']>>,
): Promise<void> {
  vi.mocked((await import('./jwt-decoder.logic')).validateJwtSignature).mockResolvedValue(result);
}

describe('JwtDecoderPage', () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined) },
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

  it('decodifica o token e renderiza a validacao separada da assinatura', async () => {
    const token = createJwtToken(
      { alg: 'HS256', typ: 'JWT' },
      { exp: 4_070_908_800, iat: 1_735_689_600, iss: 'dev-toolbox', sub: 'user-123' },
      'c2lnbmF0dXJlLWRldi10b29sYm94',
    );

    await renderDecodedPage(token);

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Header')).toHaveValue(
        JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2),
      );
      expect(screen.getByLabelText<HTMLInputElement>('Segredo HMAC')).toBeInTheDocument();
      expect(screen.getByLabelText<HTMLTextAreaElement>('Signature')).toHaveValue(
        'c2lnbmF0dXJlLWRldi10b29sYm94',
      );
      expect(screen.getAllByText('Não expirado').length).toBeGreaterThan(0);
      expect(screen.getByText('Aguardando validacao')).toBeInTheDocument();
    });
  });

  it('mostra assinatura valida quando a verificacao HMAC retorna sucesso', async () => {
    await mockSignatureValidation({
      success: true,
      data: {
        status: 'valid',
        algorithm: 'HS256',
        message:
          'A assinatura HMAC confere com o token e o segredo informados. Isso nao garante que o token seja utilizavel pela aplicacao.',
      },
    });

    await renderDecodedPage(createJwtToken({ alg: 'HS256', typ: 'JWT' }, { sub: 'user-123' }, 'assinatura'));
    fireEvent.change(await screen.findByLabelText<HTMLInputElement>('Segredo HMAC'), {
      target: { value: 'segredo-correto' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar assinatura/i }));

    await waitFor(() => {
      expect(screen.getByText('Assinatura valida')).toBeInTheDocument();
      expect(
        screen.getAllByText(/isso nao garante que o token seja utilizavel pela aplicacao/i).length,
      ).toBeGreaterThan(0);
    });
  });

  it('mostra assinatura invalida quando a verificacao HMAC falha', async () => {
    await mockSignatureValidation({
      success: true,
      data: {
        status: 'invalid',
        algorithm: 'HS256',
        message: 'A assinatura HMAC nao confere com o token e o segredo informados.',
      },
    });

    await renderDecodedPage(createJwtToken({ alg: 'HS256', typ: 'JWT' }, { sub: 'user-123' }, 'assinatura'));
    fireEvent.change(await screen.findByLabelText<HTMLInputElement>('Segredo HMAC'), {
      target: { value: 'segredo-errado' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar assinatura/i }));

    await waitFor(() => {
      expect(screen.getByText('Assinatura invalida')).toBeInTheDocument();
      expect(
        screen.getAllByText('A assinatura HMAC nao confere com o token e o segredo informados.').length,
      ).toBeGreaterThan(0);
    });
  });

  it('mostra algoritmo nao suportado sem depender do Web Crypto do jsdom', async () => {
    await mockSignatureValidation({
      success: true,
      data: {
        status: 'unsupported-algorithm',
        algorithm: 'RS256',
        message: 'O algoritmo RS256 nao e suportado. Apenas HS256, HS384 e HS512 sao aceitos.',
      },
    });

    await renderDecodedPage(createJwtToken({ alg: 'RS256', typ: 'JWT' }, { sub: 'user-123' }, 'assinatura'));
    fireEvent.change(await screen.findByLabelText<HTMLInputElement>('Segredo HMAC'), {
      target: { value: 'segredo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar assinatura/i }));

    await waitFor(() => {
      expect(screen.getByText('Algoritmo nao suportado')).toBeInTheDocument();
      expect(screen.getByText('RS256')).toBeInTheDocument();
    });
  });

  it('limpa token, segredo e estado de validacao', async () => {
    await mockSignatureValidation({
      success: true,
      data: { status: 'valid', algorithm: 'HS256', message: 'A assinatura HMAC confere com o token e o segredo informados. Isso nao garante que o token seja utilizavel pela aplicacao.' },
    });

    await renderDecodedPage(createJwtToken({ alg: 'HS256', typ: 'JWT' }, { sub: 'user-123' }, 'assinatura'));
    fireEvent.change(await screen.findByLabelText<HTMLInputElement>('Segredo HMAC'), {
      target: { value: 'segredo' },
    });
    fireEvent.click(screen.getByRole('button', { name: /validar assinatura/i }));
    await screen.findByText('Assinatura valida');
    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Token JWT')).toHaveValue('');
      expect(screen.queryByLabelText('Segredo HMAC')).not.toBeInTheDocument();
      expect(screen.queryByText('Assinatura valida')).not.toBeInTheDocument();
    });
  });
});
