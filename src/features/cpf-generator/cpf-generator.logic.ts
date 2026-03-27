import type { Result } from '@/shared/types';
import { calculateCheckDigit } from '@/shared/utils';
import type { CpfGeneratorOptions, CpfGeneratorResult } from './cpf-generator.types';

const BASE_DIGITS_LENGTH = 9;
const FIRST_CHECK_DIGIT_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const REPEATED_SEQUENCE_PATTERN = /^(\d)\1{10}$/u;

function generateRandomDigit(): number {
  return Math.floor(Math.random() * 10);
}

function isRepeatedSequence(cpf: string): boolean {
  return REPEATED_SEQUENCE_PATTERN.test(cpf);
}

function buildRawCpf(): Result<string> {
  const baseDigits = Array.from({ length: BASE_DIGITS_LENGTH }, () => generateRandomDigit());
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

export function formatCpf(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/u, '$1.$2.$3-$4');
}

export function formatCpfGeneratorOptions(options: CpfGeneratorOptions): string {
  return [
    `Quantidade: ${String(options.quantity)}`,
    `Formato: ${options.formatted ? 'XXX.XXX.XXX-XX' : 'Somente numeros'}`,
  ].join('\n');
}

export function generateCpf(options: CpfGeneratorOptions): Result<CpfGeneratorResult> {
  if (options.quantity <= 0) {
    return {
      success: false,
      error: 'A quantidade deve ser maior que zero.',
    };
  }

  const generatedCpfs = new Set<string>();

  while (generatedCpfs.size < options.quantity) {
    const rawCpfResult = buildRawCpf();

    if (!rawCpfResult.success) {
      return rawCpfResult;
    }

    const rawCpf = rawCpfResult.data;

    if (isRepeatedSequence(rawCpf)) {
      continue;
    }

    if (generatedCpfs.has(rawCpf)) {
      continue;
    }

    generatedCpfs.add(rawCpf);
  }

  return {
    success: true,
    data: {
      cpfs: Array.from(generatedCpfs, (rawCpf) => (options.formatted ? formatCpf(rawCpf) : rawCpf)),
    },
  };
}
