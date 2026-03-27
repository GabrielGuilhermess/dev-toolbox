import type { Result } from '@/shared/types';

export function calculateCheckDigit(
  digits: number[],
  weights: number[],
): Result<number> {
  if (digits.length !== weights.length) {
    return {
      success: false,
      error: 'Digitos e pesos devem ter o mesmo comprimento.',
    };
  }

  const sum = digits.reduce((accumulator, digit, index) => {
    return accumulator + digit * (weights[index] ?? 0);
  }, 0);
  const remainder = sum % 11;

  return {
    success: true,
    data: remainder < 2 ? 0 : 11 - remainder,
  };
}
