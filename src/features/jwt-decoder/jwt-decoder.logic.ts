import type { Result } from '@/shared/types';
import type { JwtAlgorithmState, JwtHmacAlgorithm, JwtParts, JwtSignatureValidation, JwtTemporalStatus, PayloadHighlightKey } from './jwt-decoder.types';

interface ParsedJwt extends JwtParts { headerSegment: string; payloadSegment: string; }

const ERRORS = {
  empty: 'Informe um token JWT.',
  parts: 'Token JWT deve ter 3 partes separadas por ponto.',
  header: 'Nao foi possivel decodificar o header do token JWT.',
  headerObject: 'O header do token JWT deve ser um objeto JSON.',
  payload: 'Nao foi possivel decodificar o payload do token JWT.',
  payloadObject: 'O payload do token JWT deve ser um objeto JSON.',
  signature: 'Nao foi possivel decodificar a assinatura do token JWT.',
  crypto: 'Web Crypto nao esta disponivel neste ambiente.',
  secret: 'Nao foi possivel preparar o segredo para validar a assinatura.',
  verify: 'Nao foi possivel validar a assinatura do token JWT.',
};

const HASH_BY_ALGORITHM: Record<JwtHmacAlgorithm, 'SHA-256' | 'SHA-384' | 'SHA-512'> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

function decodeBase64UrlBytes(segment: string): Result<Uint8Array> {
  try {
    const normalized = segment.replace(/-/gu, '+').replace(/_/gu, '/');
    const binary = atob(`${normalized}${'='.repeat((4 - (normalized.length % 4)) % 4)}`);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return {
      success: true,
      data: bytes,
    };
  } catch {
    return { success: false, error: 'Segmento JWT invalido.' };
  }
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSubtleCrypto(value: unknown): value is SubtleCrypto {
  return isJsonObject(value) && 'importKey' in value && 'verify' in value;
}

function parseJwtObject(
  segment: string,
  decodeErrorMessage: string,
  objectErrorMessage: string,
): Result<Record<string, unknown>> {
  const decoded = decodeBase64UrlBytes(segment);
  if (!decoded.success) return { success: false, error: decodeErrorMessage };
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(decoded.data));
    return isJsonObject(parsed)
      ? { success: true, data: parsed }
      : { success: false, error: objectErrorMessage };
  } catch {
    return { success: false, error: decodeErrorMessage };
  }
}

function parseJwt(token: string): Result<ParsedJwt> {
  const normalizedToken = token.trim();
  if (normalizedToken.length === 0) return { success: false, error: ERRORS.empty };
  const parts = normalizedToken.split('.');
  if (parts.length !== 3) return { success: false, error: ERRORS.parts };
  const [headerSegment = '', payloadSegment = '', signature = ''] = parts;
  const header = parseJwtObject(headerSegment, ERRORS.header, ERRORS.headerObject);
  if (!header.success) return header;
  const payload = parseJwtObject(payloadSegment, ERRORS.payload, ERRORS.payloadObject);
  if (!payload.success) return payload;
  return {
    success: true,
    data: { header: header.data, payload: payload.data, signature, headerSegment, payloadSegment },
  };
}

function formatUnixTimestamp(timestampInSeconds: number): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(timestampInSeconds * 1000));
}

export function decodeJwt(token: string): Result<JwtParts> {
  const parsed = parseJwt(token);
  return parsed.success
    ? {
        success: true,
        data: { header: parsed.data.header, payload: parsed.data.payload, signature: parsed.data.signature },
      }
    : { success: false, error: parsed.error };
}

export function formatPayloadHighlightValue(key: PayloadHighlightKey, value: unknown): string {
  if ((key === 'exp' || key === 'iat') && typeof value === 'number' && Number.isFinite(value)) {
    return `${String(value)} (${formatUnixTimestamp(value)})`;
  }
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

export function getJwtStatus(payload: Record<string, unknown>): JwtTemporalStatus {
  return typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)
    ? 'no-exp'
    : payload.exp < Date.now() / 1000
      ? 'expired'
      : 'not-expired';
}

export function extractJwtAlgorithm(header: Record<string, unknown>): JwtAlgorithmState {
  const algorithm = typeof header.alg === 'string' && header.alg.trim().length > 0 ? header.alg.trim() : null;
  return algorithm === 'HS256' || algorithm === 'HS384' || algorithm === 'HS512'
    ? { kind: 'supported', algorithm }
    : { kind: 'unsupported', algorithm };
}

export async function validateJwtSignature(
  token: string,
  secret: string,
): Promise<Result<JwtSignatureValidation>> {
  const parsed = parseJwt(token);
  if (!parsed.success) return { success: false, error: parsed.error };
  const algorithmState = extractJwtAlgorithm(parsed.data.header);
  if (algorithmState.kind === 'unsupported') {
    return {
      success: true,
      data: {
        status: 'unsupported-algorithm',
        algorithm: algorithmState.algorithm,
        message:
          algorithmState.algorithm === null
            ? 'O header.alg nao informa um algoritmo HMAC suportado. Apenas HS256, HS384 e HS512 sao aceitos.'
            : `O algoritmo ${algorithmState.algorithm} nao e suportado. Apenas HS256, HS384 e HS512 sao aceitos.`,
      },
    };
  }
  const cryptoValue = Reflect.get(globalThis, 'crypto');
  if (!isJsonObject(cryptoValue)) return { success: false, error: ERRORS.crypto };
  const subtle = Reflect.get(cryptoValue, 'subtle');
  if (!isSubtleCrypto(subtle)) return { success: false, error: ERRORS.crypto };
  const signatureBytes = decodeBase64UrlBytes(parsed.data.signature);
  if (!signatureBytes.success) return { success: false, error: ERRORS.signature };
  const signatureBuffer = new ArrayBuffer(signatureBytes.data.byteLength);
  new Uint8Array(signatureBuffer).set(signatureBytes.data);
  let key: CryptoKey;
  try {
    key = await subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: HASH_BY_ALGORITHM[algorithmState.algorithm] },
      false,
      ['verify'],
    );
  } catch {
    return { success: false, error: ERRORS.secret };
  }
  try {
    const isValid = await subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      new TextEncoder().encode(`${parsed.data.headerSegment}.${parsed.data.payloadSegment}`),
    );
    return {
      success: true,
      data: {
        status: isValid ? 'valid' : 'invalid',
        algorithm: algorithmState.algorithm,
        message: isValid
          ? 'A assinatura HMAC confere com o token e o segredo informados. Isso nao garante que o token seja utilizavel pela aplicacao.'
          : 'A assinatura HMAC nao confere com o token e o segredo informados.',
      },
    };
  } catch {
    return { success: false, error: ERRORS.verify };
  }
}
