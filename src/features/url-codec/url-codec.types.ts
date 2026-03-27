export type UrlMode = 'encode' | 'decode';

interface UrlModeOption {
  label: string;
  description: string;
  badgeVariant: 'info' | 'success';
  inputLabel: string;
  placeholder: string;
  successMessage: string;
}

export const MODE_ORDER = ['encode', 'decode'] as const satisfies readonly UrlMode[];

export const MODE_OPTIONS = {
  encode: {
    label: 'Codificar',
    description: 'Transforme texto em um formato seguro para query strings, parametros e fragments.',
    badgeVariant: 'info',
    inputLabel: 'Texto',
    placeholder: 'Ex.:\nhello world\nemail=test@example.com&redirect=/home?q=dev toolbox#section',
    successMessage: 'Texto codificado com sucesso.',
  },
  decode: {
    label: 'Decodificar',
    description: 'Converta texto percent-encoded de volta para uma versao legivel.',
    badgeVariant: 'success',
    inputLabel: 'Texto codificado',
    placeholder:
      'Ex.:\nhello%20world\nemail%3Dtest%40example.com%26redirect%3D%2Fhome%3Fq%3Ddev%20toolbox%23section',
    successMessage: 'Texto decodificado com sucesso.',
  },
} satisfies Record<UrlMode, UrlModeOption>;
