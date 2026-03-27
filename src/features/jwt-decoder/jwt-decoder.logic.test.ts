import { describe, expect, it } from 'vitest';
import { decodeJwt, getJwtStatus } from './jwt-decoder.logic';

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

describe('jwt-decoder.logic', () => {
  it('decodifica um token JWT valido conhecido', () => {
    const token = createJwtToken(
      { alg: 'HS256', typ: 'JWT' },
      { exp: 4_070_908_800, iss: 'dev-toolbox', sub: 'user-123' },
      'c2lnbmF0dXJlLWRldi10b29sYm94',
    );

    expect(decodeJwt(token)).toEqual({
      success: true,
      data: {
        header: {
          alg: 'HS256',
          typ: 'JWT',
        },
        payload: {
          exp: 4_070_908_800,
          iss: 'dev-toolbox',
          sub: 'user-123',
        },
        signature: 'c2lnbmF0dXJlLWRldi10b29sYm94',
      },
    });
  });

  it('retorna erro quando o token tem apenas 2 partes', () => {
    expect(decodeJwt('abc.def')).toEqual({
      success: false,
      error: 'Token JWT deve ter 3 partes separadas por ponto.',
    });
  });

  it('retorna erro quando o header contem base64 invalido', () => {
    const token = `%%%.${
      encodeBase64UrlJson({
        sub: 'user-123',
      })
    }.c2ln`;

    expect(decodeJwt(token)).toEqual({
      success: false,
      error: 'Nao foi possivel decodificar o header do token JWT.',
    });
  });

  it('retorna erro quando o payload nao e um objeto JSON', () => {
    const token = createJwtToken({ alg: 'HS256', typ: 'JWT' }, 'texto puro');

    expect(decodeJwt(token)).toEqual({
      success: false,
      error: 'O payload do token JWT deve ser um objeto JSON.',
    });
  });

  it('retorna erro quando a string do token esta vazia', () => {
    expect(decodeJwt('')).toEqual({
      success: false,
      error: 'Informe um token JWT.',
    });
  });

  it('decodifica payload com caracteres unicode', () => {
    const token = createJwtToken(
      { alg: 'HS256', typ: 'JWT' },
      { exp: 4_070_908_800, name: 'Jose \u{1F680}', sub: 'usuario-unicode' },
      'c2lnLXVuaWNvZGU',
    );

    const result = decodeJwt(token);

    expect(result).toEqual({
      success: true,
      data: {
        header: {
          alg: 'HS256',
          typ: 'JWT',
        },
        payload: {
          exp: 4_070_908_800,
          name: 'Jose \u{1F680}',
          sub: 'usuario-unicode',
        },
        signature: 'c2lnLXVuaWNvZGU',
      },
    });
  });

  it('retorna status expired quando exp esta no passado', () => {
    expect(getJwtStatus({ exp: 1 })).toBe('expired');
  });

  it('retorna status no-exp quando o payload nao possui exp', () => {
    expect(getJwtStatus({ sub: 'user-123' })).toBe('no-exp');
  });

  it('retorna status valid quando exp esta no futuro', () => {
    expect(getJwtStatus({ exp: 4_070_908_800 })).toBe('valid');
  });
});
