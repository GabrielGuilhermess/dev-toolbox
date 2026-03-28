export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export type JwtTemporalStatus = 'not-expired' | 'expired' | 'no-exp';
export type JwtSignatureStatus = 'idle' | 'valid' | 'invalid' | 'unsupported-algorithm';
export type JwtHmacAlgorithm = 'HS256' | 'HS384' | 'HS512';

export type JwtAlgorithmState =
  | { kind: 'supported'; algorithm: JwtHmacAlgorithm }
  | { kind: 'unsupported'; algorithm: string | null };

export interface JwtSignatureValidation {
  status: Exclude<JwtSignatureStatus, 'idle'>;
  algorithm: string | null;
  message: string;
}

export interface JwtStatusOption {
  label: string;
  variant: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  description: string;
}

export const INITIAL_TEMPORAL_STATUS: JwtStatusOption = {
  label: 'Pronto para decodificar',
  variant: 'neutral',
  description: 'Cole um token JWT para visualizar header, payload, exp e signature.',
};

export const TEMPORAL_STATUS_OPTIONS = {
  'not-expired': {
    label: 'Não expirado',
    variant: 'success',
    description: 'O campo exp indica que o token ainda esta dentro da validade temporal.',
  },
  expired: {
    label: 'Expirado',
    variant: 'error',
    description: 'O campo exp esta no passado e o token deve ser tratado como expirado.',
  },
  'no-exp': {
    label: 'Sem expiracao',
    variant: 'neutral',
    description: 'Nenhum campo exp foi encontrado no payload decodificado.',
  },
} satisfies Record<JwtTemporalStatus, JwtStatusOption>;

export const INITIAL_SIGNATURE_STATUS: JwtStatusOption = {
  label: 'Aguardando validacao',
  variant: 'neutral',
  description: 'Suporta apenas HS256, HS384 e HS512. O segredo e tratado como texto no navegador.',
};

export const SIGNATURE_STATUS_OPTIONS = {
  valid: {
    label: 'Assinatura valida',
    variant: 'success',
    description: 'A assinatura HMAC confere com o token e o segredo informados.',
  },
  invalid: {
    label: 'Assinatura invalida',
    variant: 'error',
    description: 'A assinatura HMAC nao confere com o token e o segredo informados.',
  },
  'unsupported-algorithm': {
    label: 'Algoritmo nao suportado',
    variant: 'warning',
    description: 'O header.alg nao e suportado. Apenas HS256, HS384 e HS512 podem ser validados aqui.',
  },
} satisfies Record<Exclude<JwtSignatureStatus, 'idle'>, JwtStatusOption>;

export const PAYLOAD_HIGHLIGHT_KEYS = ['exp', 'iat', 'sub', 'iss'] as const;
export type PayloadHighlightKey = (typeof PAYLOAD_HIGHLIGHT_KEYS)[number];

export const PAYLOAD_HIGHLIGHT_LABELS = {
  exp: 'Expiracao',
  iat: 'Emitido em',
  sub: 'Subject',
  iss: 'Issuer',
} satisfies Record<PayloadHighlightKey, string>;
