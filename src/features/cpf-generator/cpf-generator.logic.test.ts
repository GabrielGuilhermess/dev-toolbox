import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCpf, generateCpf } from './cpf-generator.logic';

function calculateExpectedCheckDigit(digits: string): string {
  const weights = Array.from({ length: digits.length }, (_, index) => digits.length + 1 - index);
  const sum = Array.from(digits).reduce(
    (total, digit, index) => total + Number(digit) * (weights[index] ?? 0),
    0,
  );
  const remainder = sum % 11;

  return String(remainder < 2 ? 0 : 11 - remainder);
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (!/^\d{11}$/u.test(digits) || /^(\d)\1{10}$/u.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateExpectedCheckDigit(digits.slice(0, 9));
  const secondCheckDigit = calculateExpectedCheckDigit(digits.slice(0, 10));

  return digits === `${digits.slice(0, 9)}${firstCheckDigit}${secondCheckDigit}`;
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

describe('cpf-generator.logic', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('gera um CPF com 11 digitos no modo sem formatacao', () => {
    const result = generateCpf({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cpfs[0]).toMatch(/^\d{11}$/u);
  });

  it('gera um CPF com digitos verificadores validos', () => {
    const result = generateCpf({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(isValidCpf(result.data.cpfs[0] ?? '')).toBe(true);
  });

  it('descarta sequencias de digitos iguais durante a geracao', () => {
    const getRandomCallCount = mockRandomDigits([
      1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);

    const result = generateCpf({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(getRandomCallCount()).toBe(18);
    expect(result.data.cpfs[0]).toBe('12345678909');
    expect(result.data.cpfs[0]).not.toMatch(/^(\d)\1{10}$/u);
  });

  it('garante CPFs unicos mesmo quando um candidato se repete', () => {
    const getRandomCallCount = mockRandomDigits([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
      1, 2, 3, 4, 5, 6, 7, 8, 9,
      9, 8, 7, 6, 5, 4, 3, 2, 1,
    ]);

    const result = generateCpf({ formatted: false, quantity: 2 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(getRandomCallCount()).toBe(27);
    expect(new Set(result.data.cpfs).size).toBe(2);
  });

  it('gera 50 CPFs unicos', () => {
    const result = generateCpf({ formatted: true, quantity: 50 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cpfs).toHaveLength(50);
    expect(new Set(result.data.cpfs).size).toBe(50);
  });

  it('formata um CPF bruto com mascara', () => {
    expect(formatCpf('12345678909')).toBe('123.456.789-09');
  });

  it('retorna apenas digitos quando a formatacao esta desabilitada', () => {
    const result = generateCpf({ formatted: false, quantity: 1 });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(result.data.cpfs[0]).toMatch(/^\d{11}$/u);
  });

  it.each([0, -1])('retorna erro quando a quantidade e %s', (quantity) => {
    expect(generateCpf({ formatted: true, quantity })).toEqual({
      success: false,
      error: 'A quantidade deve ser maior que zero.',
    });
  });
});
