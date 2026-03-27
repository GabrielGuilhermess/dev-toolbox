import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64, isBase64 } from './base64-codec.logic';

describe('base64-codec.logic', () => {
  it('codifica Hello em Base64', () => {
    expect(encodeBase64('Hello')).toEqual({
      success: true,
      data: 'SGVsbG8=',
    });
  });

  it('decodifica SGVsbG8= em texto simples', () => {
    expect(decodeBase64('SGVsbG8=')).toEqual({
      success: true,
      data: 'Hello',
    });
  });

  it('codifica e decodifica texto com acentos preservando UTF-8', () => {
    const encoded = encodeBase64('cafe');
    const accentedEncoded = encodeBase64('caf\u00E9');

    expect(encoded).toEqual({
      success: true,
      data: 'Y2FmZQ==',
    });

    expect(accentedEncoded).toEqual({
      success: true,
      data: 'Y2Fmw6k=',
    });

    if (!accentedEncoded.success) {
      return;
    }

    expect(decodeBase64(accentedEncoded.data)).toEqual({
      success: true,
      data: 'caf\u00E9',
    });
  });

  it('codifica e decodifica emoji preservando UTF-8', () => {
    const encoded = encodeBase64('\u{1F680}');

    expect(encoded).toEqual({
      success: true,
      data: '8J+agA==',
    });

    if (!encoded.success) {
      return;
    }

    expect(decodeBase64(encoded.data)).toEqual({
      success: true,
      data: '\u{1F680}',
    });
  });

  it.each([
    {
      label: 'codificacao vazia',
      result: () => encodeBase64(''),
      error: 'Informe um texto para codificar.',
    },
    {
      label: 'decodificacao vazia',
      result: () => decodeBase64(''),
      error: 'Informe um texto Base64 para decodificar.',
    },
  ])('retorna erro para $label', ({ result, error }) => {
    expect(result()).toEqual({
      success: false,
      error,
    });
  });

  it('retorna erro quando o Base64 informado e invalido', () => {
    expect(decodeBase64('!!!')).toEqual({
      success: false,
      error: 'Informe um texto Base64 valido.',
    });
  });

  it('reconhece uma string Base64 valida', () => {
    expect(isBase64('SGVsbG8=')).toBe(true);
  });

  it('rejeita uma string que nao esta em Base64', () => {
    expect(isBase64('Hello World')).toBe(false);
  });
});
