import { describe, expect, it } from 'vitest';
import {
  decodeJwt,
  extractJwtAlgorithm,
  getJwtStatus,
  validateJwtSignature,
} from './jwt-decoder.logic';
import type { JwtHmacAlgorithm } from './jwt-decoder.types';

type HmacHash = 'SHA-256' | 'SHA-384' | 'SHA-512';

const HASH_BY_ALGORITHM: Record<JwtHmacAlgorithm, HmacHash> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

function encodeBase64UrlText(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function encodeBase64UrlBytes(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function encodeBase64UrlJson(value: unknown): string {
  return encodeBase64UrlText(JSON.stringify(value));
}

async function createSignedJwt(
  algorithm: JwtHmacAlgorithm,
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: algorithm, typ: 'JWT' };
  const signingInput = `${encodeBase64UrlJson(header)}.${encodeBase64UrlJson(payload)}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: HASH_BY_ALGORITHM[algorithm] },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput)),
  );
  return `${signingInput}.${encodeBase64UrlBytes(signature)}`;
}

function createJwtToken(header: unknown, payload: unknown, signature = 'c2lnbmF0dXJl'): string {
  return [encodeBase64UrlJson(header), encodeBase64UrlJson(payload), signature].join('.');
}

function tamperSignature(token: string): string {
  const [header = '', payload = '', signature = ''] = token.split('.');
  const lastCharacter = signature.slice(-1);
  const tamperedSignature = `${signature.slice(0, -1)}${lastCharacter === 'a' ? 'b' : 'a'}`;
  return `${header}.${payload}.${tamperedSignature}`;
}

describe('jwt-decoder.logic', () => {
  it('decodifica um token JWT valido conhecido', () => {
    expect(
      decodeJwt(
        createJwtToken(
          { alg: 'HS256', typ: 'JWT' },
          { exp: 4_070_908_800, iss: 'dev-toolbox', sub: 'user-123' },
          'c2lnbmF0dXJlLWRldi10b29sYm94',
        ),
      ),
    ).toEqual({
      success: true,
      data: {
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { exp: 4_070_908_800, iss: 'dev-toolbox', sub: 'user-123' },
        signature: 'c2lnbmF0dXJlLWRldi10b29sYm94',
      },
    });
  });

  it('extrai o algoritmo suportado ou sinaliza algoritmo nao suportado', () => {
    expect(extractJwtAlgorithm({ alg: 'HS256' })).toEqual({ kind: 'supported', algorithm: 'HS256' });
    expect(extractJwtAlgorithm({ alg: 'RS256' })).toEqual({
      kind: 'unsupported',
      algorithm: 'RS256',
    });
  });

  it('valida HS256 com segredo correto e incorreto', async () => {
    const token = await createSignedJwt('HS256', { sub: 'user-123' }, 'segredo-dev-toolbox');
    await expect(validateJwtSignature(token, 'segredo-dev-toolbox')).resolves.toEqual({
      success: true,
      data: {
        status: 'valid',
        algorithm: 'HS256',
        message:
          'A assinatura HMAC confere com o token e o segredo informados. Isso nao garante que o token seja utilizavel pela aplicacao.',
      },
    });
    await expect(validateJwtSignature(token, 'segredo-errado')).resolves.toEqual({
      success: true,
      data: {
        status: 'invalid',
        algorithm: 'HS256',
        message: 'A assinatura HMAC nao confere com o token e o segredo informados.',
      },
    });
  });

  it.each([
    ['HS384', 'segredo-384'],
    ['HS512', 'segredo-512'],
  ] satisfies [JwtHmacAlgorithm, string][])('valida %s com assinatura real', async (algorithm, secret) => {
    const token = await createSignedJwt(algorithm, { iss: 'dev-toolbox' }, secret);
    await expect(validateJwtSignature(token, secret)).resolves.toMatchObject({
      success: true,
      data: { status: 'valid', algorithm },
    });
  });

  it('detecta assinatura adulterada', async () => {
    const token = await createSignedJwt('HS256', { sub: 'user-123' }, 'segredo-assinatura');
    await expect(validateJwtSignature(tamperSignature(token), 'segredo-assinatura')).resolves.toEqual({
      success: true,
      data: {
        status: 'invalid',
        algorithm: 'HS256',
        message: 'A assinatura HMAC nao confere com o token e o segredo informados.',
      },
    });
  });

  it('retorna erro quando o token e malformado', async () => {
    await expect(validateJwtSignature('abc.def', 'segredo')).resolves.toEqual({
      success: false,
      error: 'Token JWT deve ter 3 partes separadas por ponto.',
    });
  });

  it('retorna algoritmo nao suportado para validacao HMAC', async () => {
    await expect(
      validateJwtSignature(
        createJwtToken({ alg: 'RS256', typ: 'JWT' }, { sub: 'user-123' }, 'assinatura'),
        'segredo',
      ),
    ).resolves.toEqual({
      success: true,
      data: {
        status: 'unsupported-algorithm',
        algorithm: 'RS256',
        message: 'O algoritmo RS256 nao e suportado. Apenas HS256, HS384 e HS512 sao aceitos.',
      },
    });
  });

  it('mantem o status temporal do token', () => {
    expect(getJwtStatus({ exp: 1 })).toBe('expired');
    expect(getJwtStatus({ sub: 'user-123' })).toBe('no-exp');
    expect(getJwtStatus({ exp: 4_070_908_800 })).toBe('not-expired');
  });
});
