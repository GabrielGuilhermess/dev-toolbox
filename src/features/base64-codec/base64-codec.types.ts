export type Base64Mode = 'encode' | 'decode';

interface Base64ModeOption {
  label: string;
  description: string;
  badgeVariant: 'info' | 'success';
  inputLabel: string;
  placeholder: string;
  successMessage: string;
}

export const MODE_ORDER = ['encode', 'decode'] as const satisfies readonly Base64Mode[];

export const MODE_OPTIONS = {
  encode: {
    label: 'Codificar',
    description: 'Converta texto simples em Base64 com suporte correto a UTF-8.',
    badgeVariant: 'info',
    inputLabel: 'Texto',
    placeholder: 'Ex.:\nHello\ncafe\n\u{1F680}',
    successMessage: 'Texto codificado com sucesso.',
  },
  decode: {
    label: 'Decodificar',
    description: 'Converta Base64 em texto legivel, incluindo acentos e emojis.',
    badgeVariant: 'success',
    inputLabel: 'Base64',
    placeholder: 'Ex.:\nSGVsbG8=\nY2Fmw6k=\n8J+agA==',
    successMessage: 'Texto decodificado com sucesso.',
  },
} satisfies Record<Base64Mode, Base64ModeOption>;
