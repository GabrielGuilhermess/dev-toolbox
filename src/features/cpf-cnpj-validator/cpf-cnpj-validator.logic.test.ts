import { describe, expect, it } from 'vitest';
import { validateDocument } from './cpf-cnpj-validator.logic';

describe('validateDocument', () => {
  it('detecta um CPF com 11 digitos', () => {
    expect(validateDocument('12345678909')).toEqual({
      success: true,
      data: {
        type: 'cpf',
        valid: true,
        formatted: '123.456.789-09',
      },
    });
  });

  it('detecta um CPF formatado corretamente', () => {
    expect(validateDocument('123.456.789-09')).toEqual({
      success: true,
      data: {
        type: 'cpf',
        valid: true,
        formatted: '123.456.789-09',
      },
    });
  });

  it('detecta um CNPJ com 14 digitos', () => {
    expect(validateDocument('11222333000181')).toEqual({
      success: true,
      data: {
        type: 'cnpj',
        valid: true,
        formatted: '11.222.333/0001-81',
      },
    });
  });

  it('detecta um CNPJ formatado corretamente', () => {
    expect(validateDocument('11.222.333/0001-81')).toEqual({
      success: true,
      data: {
        type: 'cnpj',
        valid: true,
        formatted: '11.222.333/0001-81',
      },
    });
  });

  it('retorna CPF invalido sem transformar o resultado em erro', () => {
    expect(validateDocument('111.111.111-11')).toEqual({
      success: true,
      data: {
        type: 'cpf',
        valid: false,
        formatted: '111.111.111-11',
      },
    });
  });

  it.each(['12345', '', 'abc123def456'])(
    'retorna erro quando o comprimento extraido do documento e invalido: %j',
    (input) => {
      expect(validateDocument(input)).toEqual({
        success: false,
        error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.',
      });
    },
  );
});
