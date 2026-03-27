import type { Result } from '@/shared/types';

const ENCODE_EMPTY_INPUT_ERROR = 'Informe um texto para codificar.';
const DECODE_EMPTY_INPUT_ERROR = 'Informe um texto codificado para decodificar.';
const INVALID_URL_ERROR = 'Informe um texto codificado valido.';

export function encodeUrl(input: string): Result<string> {
  if (input.length === 0) {
    return {
      success: false,
      error: ENCODE_EMPTY_INPUT_ERROR,
    };
  }

  return {
    success: true,
    data: encodeURIComponent(input),
  };
}

export function decodeUrl(input: string): Result<string> {
  if (input.length === 0) {
    return {
      success: false,
      error: DECODE_EMPTY_INPUT_ERROR,
    };
  }

  try {
    return {
      success: true,
      data: decodeURIComponent(input),
    };
  } catch {
    return {
      success: false,
      error: INVALID_URL_ERROR,
    };
  }
}
