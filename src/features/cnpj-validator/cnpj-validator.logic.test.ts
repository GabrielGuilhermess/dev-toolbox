import { describe, expect, it } from 'vitest';
import { validateCnpj } from './cnpj-validator.logic';

describe('validateCnpj', () => {
  it('valida um CNPJ formatado corretamente', () => {
    expect(validateCnpj('11.222.333/0001-81')).toEqual({
      success: true,
      data: {
        valid: true,
        formatted: '11.222.333/0001-81',
      },
    });
  });

  it('valida um CNPJ sem formatacao', () => {
    expect(validateCnpj('11222333000181')).toEqual({
      success: true,
      data: {
        valid: true,
        formatted: '11.222.333/0001-81',
      },
    });
  });

  it('rejeita sequencias repetidas sem retornar erro', () => {
    expect(validateCnpj('11.111.111/1111-11')).toEqual({
      success: true,
      data: {
        valid: false,
        formatted: '11.111.111/1111-11',
      },
    });
  });

  it('marca como invalido quando os digitos verificadores nao conferem', () => {
    expect(validateCnpj('11.222.333/0001-00')).toEqual({
      success: true,
      data: {
        valid: false,
        formatted: '11.222.333/0001-00',
      },
    });
  });

  it.each([
    ['', 'Informe um CNPJ.'],
    ['abc', 'Informe um CNPJ.'],
    ['1234567890', 'O CNPJ deve conter 14 digitos.'],
  ])('retorna erro para o input %j', (input, error) => {
    expect(validateCnpj(input)).toEqual({
      success: false,
      error,
    });
  });
});
