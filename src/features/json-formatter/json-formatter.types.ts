export type JsonMode = 'format' | 'validate' | 'minify';

export interface JsonFormatOptions {
  indent: 2 | 4;
}

interface JsonModeOption {
  label: string;
  description: string;
  badgeVariant: 'warning' | 'info' | 'success';
  successMessage: string;
}

export const MODE_OPTIONS = {
  format: {
    label: 'Formatar',
    description: 'Organize o JSON com identacao legivel para leitura e revisao.',
    badgeVariant: 'warning',
    successMessage: 'JSON formatado com sucesso.',
  },
  validate: {
    label: 'Validar',
    description: 'Confirme se o JSON e valido e visualize o conteudo normalizado.',
    badgeVariant: 'info',
    successMessage: 'JSON valido.',
  },
  minify: {
    label: 'Minificar',
    description: 'Remova espacos e quebras de linha para gerar uma versao compacta.',
    badgeVariant: 'success',
    successMessage: 'JSON minificado com sucesso.',
  },
} satisfies Record<JsonMode, JsonModeOption>;

export const MODE_ORDER = ['format', 'validate', 'minify'] as const satisfies readonly JsonMode[];

export const INDENT_OPTIONS = [2, 4] as const satisfies readonly JsonFormatOptions['indent'][];

export const INITIAL_FORMAT_OPTIONS = {
  indent: 2,
} satisfies JsonFormatOptions;
