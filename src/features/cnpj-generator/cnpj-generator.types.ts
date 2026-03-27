export interface CnpjGeneratorOptions {
  formatted: boolean;
  quantity: number;
}

export interface CnpjGeneratorResult {
  cnpjs: string[];
}

export const QUANTITY_OPTIONS = [1, 5, 10, 25, 50] as const;

export const INITIAL_OPTIONS = {
  formatted: true,
  quantity: 1,
} satisfies CnpjGeneratorOptions;
