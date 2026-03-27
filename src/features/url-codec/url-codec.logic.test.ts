import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl } from './url-codec.logic';

describe('url-codec.logic', () => {
  it('codifica hello world para uso em URL', () => {
    expect(encodeUrl('hello world')).toEqual({
      success: true,
      data: 'hello%20world',
    });
  });

  it('decodifica hello%20world para texto simples', () => {
    expect(decodeUrl('hello%20world')).toEqual({
      success: true,
      data: 'hello world',
    });
  });

  it('codifica caracteres especiais reservados em URLs', () => {
    expect(encodeUrl('email=test@example.com&redirect=/home?q=dev toolbox#section')).toEqual({
      success: true,
      data: 'email%3Dtest%40example.com%26redirect%3D%2Fhome%3Fq%3Ddev%20toolbox%23section',
    });
  });

  it('retorna erro quando a URL codificada esta malformada', () => {
    expect(decodeUrl('%E0%A4%A')).toEqual({
      success: false,
      error: 'Informe um texto codificado valido.',
    });
  });

  it.each([
    {
      label: 'codificacao vazia',
      result: () => encodeUrl(''),
      error: 'Informe um texto para codificar.',
    },
    {
      label: 'decodificacao vazia',
      result: () => decodeUrl(''),
      error: 'Informe um texto codificado para decodificar.',
    },
  ])('retorna erro para $label', ({ result, error }) => {
    expect(result()).toEqual({
      success: false,
      error,
    });
  });

  it('codifica uma URL completa com query string e fragment', () => {
    expect(encodeUrl('https://example.com/search?q=dev toolbox&lang=pt-BR#secao')).toEqual({
      success: true,
      data: 'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddev%20toolbox%26lang%3Dpt-BR%23secao',
    });
  });

  it('decodifica uma URL completa com query string e fragment', () => {
    expect(
      decodeUrl(
        'https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Ddev%20toolbox%26lang%3Dpt-BR%23secao',
      ),
    ).toEqual({
      success: true,
      data: 'https://example.com/search?q=dev toolbox&lang=pt-BR#secao',
    });
  });
});
