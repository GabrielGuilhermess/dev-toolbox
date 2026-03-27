import type { Result } from '@/shared/types';

const BASE64_PATTERN = /^[A-Za-z0-9+/]*={0,2}$/u;
const ENCODE_EMPTY_INPUT_ERROR = 'Informe um texto para codificar.';
const DECODE_EMPTY_INPUT_ERROR = 'Informe um texto Base64 para decodificar.';
const INVALID_BASE64_ERROR = 'Informe um texto Base64 valido.';

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return binary;
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function isBase64(input: string): boolean {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return false;
  }

  return normalizedInput.length % 4 === 0 && BASE64_PATTERN.test(normalizedInput);
}

export function encodeBase64(input: string): Result<string> {
  if (input.length === 0) {
    return {
      success: false,
      error: ENCODE_EMPTY_INPUT_ERROR,
    };
  }

  const bytes = new TextEncoder().encode(input);

  return {
    success: true,
    data: btoa(bytesToBinaryString(bytes)),
  };
}

export function decodeBase64(input: string): Result<string> {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return {
      success: false,
      error: DECODE_EMPTY_INPUT_ERROR,
    };
  }

  if (!isBase64(normalizedInput)) {
    return {
      success: false,
      error: INVALID_BASE64_ERROR,
    };
  }

  try {
    const binary = atob(normalizedInput);
    const bytes = binaryStringToBytes(binary);

    return {
      success: true,
      data: new TextDecoder().decode(bytes),
    };
  } catch {
    return {
      success: false,
      error: INVALID_BASE64_ERROR,
    };
  }
}
