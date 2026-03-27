import { describe, expect, it } from 'vitest';
import { validateCpf } from './cpf-validator.logic';

describe('validateCpf', () => {
  it('valida um CPF formatado corretamente', () => {
    expect(validateCpf('123.456.789-09')).toEqual({
      success: true,
      data: {
        valid: true,
        formatted: '123.456.789-09',
        digits: {
          first: 0,
          second: 9,
        },
      },
    });
  });

  it('valida um CPF sem formatacao', () => {
    expect(validateCpf('12345678909')).toEqual({
      success: true,
      data: {
        valid: true,
        formatted: '123.456.789-09',
        digits: {
          first: 0,
          second: 9,
        },
      },
    });
  });

  it('aceita um CPF com espacos extras', () => {
    expect(validateCpf('  123.456.789-09  ')).toEqual({
      success: true,
      data: {
        valid: true,
        formatted: '123.456.789-09',
        digits: {
          first: 0,
          second: 9,
        },
      },
    });
  });

  it('rejeita sequencias repetidas sem retornar erro', () => {
    expect(validateCpf('111.111.111-11')).toEqual({
      success: true,
      data: {
        valid: false,
        formatted: '111.111.111-11',
        digits: {
          first: 1,
          second: 1,
        },
      },
    });
  });

  it('marca como invalido quando os digitos verificadores nao conferem', () => {
    expect(validateCpf('123.456.789-00')).toEqual({
      success: true,
      data: {
        valid: false,
        formatted: '123.456.789-00',
        digits: {
          first: 0,
          second: 9,
        },
      },
    });
  });

  it.each([
    ['', 'Informe um CPF.'],
    ['abc', 'Informe um CPF.'],
    ['1234567890', 'O CPF deve conter 11 digitos.'],
    ['123456789012', 'O CPF deve conter 11 digitos.'],
  ])('retorna erro para o input %j', (input, error) => {
    expect(validateCpf(input)).toEqual({
      success: false,
      error,
    });
  });
});
