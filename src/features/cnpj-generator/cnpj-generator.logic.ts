import type { Result } from '@/shared/types';
import { calculateCheckDigit } from '@/shared/utils';
import type {
  CnpjGeneratorOptions,
  CnpjGeneratorResult,
} from './cnpj-generator.types';

const BASE_DIGITS_LENGTH = 12;
const FIRST_CHECK_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const REPEATED_BASE_SEQUENCE_PATTERN = /^(\d)\1{11}$/u;

function generateRandomDigit(): number {
  return Math.floor(Math.random() * 10);
}

function generateBaseDigits(): number[] {
  return Array.from({ length: BASE_DIGITS_LENGTH }, () => generateRandomDigit());
}

function isRepeatedBaseSequence(baseDigits: number[]): boolean {
  return REPEATED_BASE_SEQUENCE_PATTERN.test(baseDigits.join(''));
}

function buildRawCnpj(baseDigits: number[]): Result<string> {
  const firstCheckDigitResult = calculateCheckDigit(baseDigits, FIRST_CHECK_DIGIT_WEIGHTS);

  if (!firstCheckDigitResult.success) {
    return firstCheckDigitResult;
  }

  const secondCheckDigitResult = calculateCheckDigit(
    [...baseDigits, firstCheckDigitResult.data],
    SECOND_CHECK_DIGIT_WEIGHTS,
  );

  if (!secondCheckDigitResult.success) {
    return secondCheckDigitResult;
  }

  return {
    success: true,
    data: [...baseDigits, firstCheckDigitResult.data, secondCheckDigitResult.data].join(''),
  };
}

export function formatCnpj(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/u,
    '$1.$2.$3/$4-$5',
  );
}

export function formatCnpjGeneratorOptions(options: CnpjGeneratorOptions): string {
  return [
    `Quantidade: ${String(options.quantity)}`,
    `Formato: ${options.formatted ? 'XX.XXX.XXX/XXXX-XX' : 'Somente numeros'}`,
  ].join('\n');
}

export function generateCnpj(
  options: CnpjGeneratorOptions,
): Result<CnpjGeneratorResult> {
  if (!Number.isInteger(options.quantity) || options.quantity <= 0) {
    return {
      success: false,
      error: 'A quantidade deve ser maior que zero.',
    };
  }

  const generatedCnpjs = new Set<string>();

  while (generatedCnpjs.size < options.quantity) {
    const baseDigits = generateBaseDigits();

    if (isRepeatedBaseSequence(baseDigits)) {
      continue;
    }

    const rawCnpjResult = buildRawCnpj(baseDigits);

    if (!rawCnpjResult.success) {
      return rawCnpjResult;
    }

    const rawCnpj = rawCnpjResult.data;

    if (generatedCnpjs.has(rawCnpj)) {
      continue;
    }

    generatedCnpjs.add(rawCnpj);
  }

  return {
    success: true,
    data: {
      cnpjs: Array.from(generatedCnpjs, (rawCnpj) =>
        options.formatted ? formatCnpj(rawCnpj) : rawCnpj,
      ),
    },
  };
}
