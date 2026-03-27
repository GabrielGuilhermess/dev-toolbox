import type { Result } from '@/shared/types';
import { calculateCheckDigit } from '@/shared/utils';
import type { CnpjValidationResult } from './cnpj-validator.types';

const CNPJ_LENGTH = 14;
const BASE_DIGITS_LENGTH = 12;
const FIRST_CHECK_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const REPEATED_SEQUENCE_PATTERN = /^(\d)\1{13}$/u;

function sanitizeCnpj(input: string): string {
  return input.replace(/\D/g, '');
}

function formatCnpj(digits: string): string {
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/u,
    '$1.$2.$3/$4-$5',
  );
}

function isRepeatedSequence(digits: string): boolean {
  return REPEATED_SEQUENCE_PATTERN.test(digits);
}

function calculateVerificationDigits(digits: string): Result<string> {
  const baseDigits = Array.from(
    digits.slice(0, BASE_DIGITS_LENGTH),
    Number,
  );
  const firstDigitResult = calculateCheckDigit(baseDigits, FIRST_CHECK_DIGIT_WEIGHTS);

  if (!firstDigitResult.success) {
    return firstDigitResult;
  }

  const secondDigitResult = calculateCheckDigit(
    [...baseDigits, firstDigitResult.data],
    SECOND_CHECK_DIGIT_WEIGHTS,
  );

  if (!secondDigitResult.success) {
    return secondDigitResult;
  }

  return {
    success: true,
    data: `${String(firstDigitResult.data)}${String(secondDigitResult.data)}`,
  };
}

export function validateCnpj(input: string): Result<CnpjValidationResult> {
  const digits = sanitizeCnpj(input);

  if (digits.length === 0) {
    return {
      success: false,
      error: 'Informe um CNPJ.',
    };
  }

  if (digits.length !== CNPJ_LENGTH) {
    return {
      success: false,
      error: 'O CNPJ deve conter 14 digitos.',
    };
  }

  const verificationDigitsResult = calculateVerificationDigits(digits);

  if (!verificationDigitsResult.success) {
    return verificationDigitsResult;
  }

  return {
    success: true,
    data: {
      valid:
        !isRepeatedSequence(digits) &&
        digits.slice(BASE_DIGITS_LENGTH) === verificationDigitsResult.data,
      formatted: formatCnpj(digits),
    },
  };
}
