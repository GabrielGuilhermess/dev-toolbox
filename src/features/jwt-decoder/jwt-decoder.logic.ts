import type { Result } from '@/shared/types';
import type {
  JwtParts,
  JwtStatus,
  JwtStatusOption,
  PayloadHighlightKey,
} from './jwt-decoder.types';
import {
  INITIAL_STATUS,
  STATUS_OPTIONS,
} from './jwt-decoder.types';

const EMPTY_TOKEN_ERROR = 'Informe um token JWT.';
const INVALID_PARTS_ERROR = 'Token JWT deve ter 3 partes separadas por ponto.';
const INVALID_HEADER_ERROR = 'Nao foi possivel decodificar o header do token JWT.';
const INVALID_HEADER_OBJECT_ERROR = 'O header do token JWT deve ser um objeto JSON.';
const INVALID_PAYLOAD_ERROR = 'Nao foi possivel decodificar o payload do token JWT.';
const INVALID_PAYLOAD_OBJECT_ERROR = 'O payload do token JWT deve ser um objeto JSON.';

function normalizeBase64UrlSegment(segment: string): string {
  const normalizedSegment = segment.replace(/-/gu, '+').replace(/_/gu, '/');
  const paddingLength = (4 - (normalizedSegment.length % 4)) % 4;

  return `${normalizedSegment}${'='.repeat(paddingLength)}`;
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeBase64UrlSegment(segment: string): Result<string> {
  try {
    const normalizedSegment = normalizeBase64UrlSegment(segment);
    const binary = atob(normalizedSegment);
    const bytes = binaryStringToBytes(binary);

    return {
      success: true,
      data: new TextDecoder().decode(bytes),
    };
  } catch {
    return {
      success: false,
      error: 'Segmento JWT invalido.',
    };
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJwtObjectSegment(
  segment: string,
  decodeErrorMessage: string,
  objectErrorMessage: string,
): Result<Record<string, unknown>> {
  const decodedSegment = decodeBase64UrlSegment(segment);

  if (!decodedSegment.success) {
    return {
      success: false,
      error: decodeErrorMessage,
    };
  }

  try {
    const parsedSegment: unknown = JSON.parse(decodedSegment.data);

    if (!isJsonObject(parsedSegment)) {
      return {
        success: false,
        error: objectErrorMessage,
      };
    }

    return {
      success: true,
      data: parsedSegment,
    };
  } catch {
    return {
      success: false,
      error: decodeErrorMessage,
    };
  }
}

export function decodeJwt(token: string): Result<JwtParts> {
  const normalizedToken = token.trim();

  if (normalizedToken.length === 0) {
    return {
      success: false,
      error: EMPTY_TOKEN_ERROR,
    };
  }

  const tokenParts = normalizedToken.split('.');

  if (tokenParts.length !== 3) {
    return {
      success: false,
      error: INVALID_PARTS_ERROR,
    };
  }

  const headerSegment = tokenParts[0];
  const payloadSegment = tokenParts[1];
  const signature = tokenParts[2];

  if (headerSegment === undefined || payloadSegment === undefined || signature === undefined) {
    return {
      success: false,
      error: INVALID_PARTS_ERROR,
    };
  }

  const headerResult = parseJwtObjectSegment(
    headerSegment,
    INVALID_HEADER_ERROR,
    INVALID_HEADER_OBJECT_ERROR,
  );

  if (!headerResult.success) {
    return headerResult;
  }

  const payloadResult = parseJwtObjectSegment(
    payloadSegment,
    INVALID_PAYLOAD_ERROR,
    INVALID_PAYLOAD_OBJECT_ERROR,
  );

  if (!payloadResult.success) {
    return payloadResult;
  }

  return {
    success: true,
    data: {
      header: headerResult.data,
      payload: payloadResult.data,
      signature,
    },
  };
}

function formatUnixTimestamp(timestampInSeconds: number): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(timestampInSeconds * 1000));
}

export function formatPayloadHighlightValue(key: PayloadHighlightKey, value: unknown): string {
  if ((key === 'exp' || key === 'iat') && typeof value === 'number' && Number.isFinite(value)) {
    return `${String(value)} (${formatUnixTimestamp(value)})`;
  }

  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

export function getJwtStatus(payload: Record<string, unknown>): JwtStatus {
  const exp = payload.exp;

  if (typeof exp !== 'number' || !Number.isFinite(exp)) {
    return 'no-exp';
  }

  return exp < Date.now() / 1000 ? 'expired' : 'valid';
}

export function renderStatusBadge(status: JwtStatus | null): JwtStatusOption {
  return status === null ? INITIAL_STATUS : STATUS_OPTIONS[status];
}
