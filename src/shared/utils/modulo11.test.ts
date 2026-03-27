import { describe, expect, it } from 'vitest';

import { calculateCheckDigit } from '@/shared/utils';

describe('calculateCheckDigit', () => {
  it('deve calcular os dígitos verificadores do CPF 123.456.789-09', () => {
    const firstDigitResult = calculateCheckDigit(
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [10, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    const secondDigitResult = firstDigitResult.success
      ? calculateCheckDigit(
          [1, 2, 3, 4, 5, 6, 7, 8, 9, firstDigitResult.data],
          [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
        )
      : firstDigitResult;

    expect(firstDigitResult).toEqual({
      success: true,
      data: 0,
    });
    expect(secondDigitResult).toEqual({
      success: true,
      data: 9,
    });
  });

  it('deve calcular os dígitos verificadores do CNPJ 11.222.333/0001-81', () => {
    const firstDigitResult = calculateCheckDigit(
      [1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1],
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    const secondDigitResult = firstDigitResult.success
      ? calculateCheckDigit(
          [1, 1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1, firstDigitResult.data],
          [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
        )
      : firstDigitResult;

    expect(firstDigitResult).toEqual({
      success: true,
      data: 8,
    });
    expect(secondDigitResult).toEqual({
      success: true,
      data: 1,
    });
  });

  it('deve retornar 0 quando receber arrays vazios', () => {
    expect(calculateCheckDigit([], [])).toEqual({
      success: true,
      data: 0,
    });
  });

  it('deve retornar erro quando digits e weights tiverem comprimentos diferentes', () => {
    expect(calculateCheckDigit([1, 2], [3])).toEqual({
      success: false,
      error: 'Digitos e pesos devem ter o mesmo comprimento.',
    });
  });
});
