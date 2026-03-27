// eslint-disable-next-line no-restricted-imports -- Excecao documentada para reutilizar a logica dos validadores individuais.
import { validateCnpj } from '@/features/cnpj-validator/cnpj-validator.logic';
// eslint-disable-next-line no-restricted-imports -- Excecao documentada para reutilizar a logica dos validadores individuais.
import { validateCpf } from '@/features/cpf-validator/cpf-validator.logic';
import type { Result } from '@/shared/types';
import type { DocumentValidationResult } from './cpf-cnpj-validator.types';

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

function sanitizeDocument(input: string): string {
  return input.replace(/\D/g, '');
}

function buildValidationResult(
  type: DocumentValidationResult['type'],
  valid: boolean,
  formatted: string,
): Result<DocumentValidationResult> {
  return {
    success: true,
    data: {
      type,
      valid,
      formatted,
    },
  };
}

export function validateDocument(input: string): Result<DocumentValidationResult> {
  const digits = sanitizeDocument(input);

  if (digits.length === CPF_LENGTH) {
    const result = validateCpf(digits);

    if (!result.success) {
      return result;
    }

    return buildValidationResult('cpf', result.data.valid, result.data.formatted);
  }

  if (digits.length === CNPJ_LENGTH) {
    const result = validateCnpj(digits);

    if (!result.success) {
      return result;
    }

    return buildValidationResult('cnpj', result.data.valid, result.data.formatted);
  }

  return {
    success: false,
    error: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.',
  };
}
