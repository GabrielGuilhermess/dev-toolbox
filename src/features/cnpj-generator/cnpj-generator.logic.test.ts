import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCnpj, generateCnpj } from './cnpj-generator.logic';

const FIRST_CHECK_DIGIT_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const SECOND_CHECK_DIGIT_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calculateExpectedCheckDigit(digits: string, weights: number[]): string {
  const sum = Array.from(digits).reduce(
    (total, digit, index) => total + Number(digit) * (weights[index] ?? 0),
    0,
  );
  const remainder = sum % 11;

  return String(remainder < 2 ? 0 : 11 - remainder);
}

function buildExpectedCnpj(baseDigits: string): string {
  const firstCheckDigit = calculateExpectedCheckDigit(
    baseDigits,
    FIRST_CHECK_DIGIT_WEIGHTS,
  );
  const secondCheckDigit = calculateExpectedCheckDigit(
    `${baseDigits}${firstCheckDigit}`,
    SECOND_CHECK_DIGIT_WEIGHTS,
  );

  return `${baseDigits}${firstCheckDigit}${secondCheckDigit}`;
}

function isValidCnpj(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');

  if (!/^\d{14}$/u.test(digits) || /^(\d)\1{13}$/u.test(digits)) {
    return false;
  }

  const baseDigits = digits.slice(0, 12);
  const firstCheckDigit = calculateExpectedCheckDigit(
    baseDigits,
    FIRST_CHECK_DIGIT_WEIGHTS,
  );
  const secondCheckDigit = calculateExpectedCheckDigit(
    `${baseDigits}${firstCheckDigit}`,
    SECOND_CHECK_DIGIT_WEIGHTS,
  );

  return digits === `${baseDigits}${firstCheckDigit}${secondCheckDigit}`;
}

function mockRandomDigits(digits: number[]): () => number {
  let index = 0;

  vi.spyOn(Math, 'random').mockImplementation(() => {
    const digit = digits[index] ?? 0;

    index += 1;

    return (digit + 0.01) / 10;
  });

  return () => index;
}

describe('cnpj-generator.logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gera um CNPJ com 14 digitos no modo sem formatacao', () => {
    const result = generateCnpj({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cnpjs[0]).toMatch(/^\d{14}$/u);
  });

  it('gera um CNPJ com digitos verificadores validos', () => {
    const result = generateCnpj({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(isValidCnpj(result.data.cnpjs[0] ?? '')).toBe(true);
  });

  it('descarta bases com sequencia de digitos iguais durante a geracao', () => {
    const getRandomCallCount = mockRandomDigits([
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 1,
    ]);

    const result = generateCnpj({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(getRandomCallCount()).toBe(24);
    expect(result.data.cnpjs[0]).toBe('12345678000195');
    expect(result.data.cnpjs[0]).not.toMatch(/^(\d)\1{13}$/u);
  });

  it('garante CNPJs unicos mesmo quando um candidato se repete', () => {
    const getRandomCallCount = mockRandomDigits([
      1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 1,
      1, 2, 3, 4, 5, 6, 7, 8, 0, 0, 0, 1,
      9, 8, 7, 6, 5, 4, 3, 2, 0, 0, 0, 1,
    ]);

    const result = generateCnpj({ formatted: false, quantity: 2 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(getRandomCallCount()).toBe(36);
    expect(result.data.cnpjs).toEqual(['12345678000195', '98765432000198']);
    expect(new Set(result.data.cnpjs).size).toBe(2);
  });

  it('gera 50 CNPJs unicos', () => {
    const result = generateCnpj({ formatted: true, quantity: 50 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cnpjs).toHaveLength(50);
    expect(new Set(result.data.cnpjs).size).toBe(50);
  });

  it('formata um CNPJ bruto com mascara', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81');
  });

  it('retorna apenas digitos quando a formatacao esta desabilitada', () => {
    const result = generateCnpj({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cnpjs[0]).toMatch(/^\d{14}$/u);
  });

  it.each([0, -1])('retorna erro quando a quantidade e %s', (quantity) => {
    expect(generateCnpj({ formatted: true, quantity })).toEqual({
      success: false,
      error: 'A quantidade deve ser maior que zero.',
    });
  });

  it('gera o CNPJ esperado a partir de uma base conhecida', () => {
    expect(buildExpectedCnpj('123456780001')).toBe('12345678000195');
  });
});
