import type { Result } from '@/shared/types';
import { calculateCheckDigit } from '@/shared/utils';
import type { CpfValidationResult } from './cpf-validator.types';

const CPF_LENGTH = 11;
const BASE_DIGITS_LENGTH = 9;
const FIRST_CHECK_DIGIT_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const REPEATED_SEQUENCE_PATTERN = /^(\d)\1{10}$/u;

function sanitizeCpf(input: string): string {
  return input.replace(/\D/g, '');
}

function formatCpf(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/u, '$1.$2.$3-$4');
}

function isRepeatedSequence(digits: string): boolean {
  return REPEATED_SEQUENCE_PATTERN.test(digits);
}

function calculateDigits(digits: string): Result<CpfValidationResult['digits']> {
  const baseDigits = Array.from(digits.slice(0, BASE_DIGITS_LENGTH), Number);
  const firstResult = calculateCheckDigit(baseDigits, FIRST_CHECK_DIGIT_WEIGHTS);

  if (!firstResult.success) {
    return firstResult;
  }

  const secondResult = calculateCheckDigit(
    [...baseDigits, firstResult.data],
    SECOND_CHECK_DIGIT_WEIGHTS,
  );

  if (!secondResult.success) {
    return secondResult;
  }

  return {
    success: true,
    data: {
      first: firstResult.data,
      second: secondResult.data,
    },
  };
}

export function validateCpf(input: string): Result<CpfValidationResult> {
  const digits = sanitizeCpf(input);

  if (digits.length === 0) {
    return {
      success: false,
      error: 'Informe um CPF.',
    };
  }

  if (digits.length !== CPF_LENGTH) {
    return {
      success: false,
      error: 'O CPF deve conter 11 digitos.',
    };
  }

  const calculatedDigitsResult = calculateDigits(digits);

  if (!calculatedDigitsResult.success) {
    return calculatedDigitsResult;
  }

  const calculatedDigits = calculatedDigitsResult.data;
  const informedDigits = {
    first: Number(digits[9]),
    second: Number(digits[10]),
  };

  return {
    success: true,
    data: {
      valid:
        !isRepeatedSequence(digits) &&
        calculatedDigits.first === informedDigits.first &&
        calculatedDigits.second === informedDigits.second,
      formatted: formatCpf(digits),
      digits: calculatedDigits,
    },
  };
}
