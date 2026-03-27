export interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

export type JwtStatus = 'valid' | 'expired' | 'no-exp';

export interface JwtStatusOption {
  label: string;
  variant: 'success' | 'error' | 'neutral';
  description: string;
}

export const INITIAL_STATUS: JwtStatusOption = {
  label: 'Pronto para decodificar',
  variant: 'neutral',
  description: 'Cole um token JWT para visualizar header, payload e signature sem validar a assinatura.',
};

export const STATUS_OPTIONS = {
  valid: {
    label: 'Valido',
    variant: 'success',
    description: 'O campo exp indica que o token ainda esta dentro da validade.',
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
} satisfies Record<JwtStatus, JwtStatusOption>;

export const PAYLOAD_HIGHLIGHT_KEYS = ['exp', 'iat', 'sub', 'iss'] as const;

export type PayloadHighlightKey = (typeof PAYLOAD_HIGHLIGHT_KEYS)[number];

export const PAYLOAD_HIGHLIGHT_LABELS = {
  exp: 'Expiracao',
  iat: 'Emitido em',
  sub: 'Subject',
  iss: 'Issuer',
} satisfies Record<PayloadHighlightKey, string>;
