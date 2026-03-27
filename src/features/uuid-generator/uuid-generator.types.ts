export interface UuidOptions {
  quantity: number;
  uppercase: boolean;
}

export interface UuidResult {
  uuids: string[];
}

export const QUANTITY_OPTIONS = [1, 5, 10, 25, 50, 100] as const;

export type QuantityOption = (typeof QUANTITY_OPTIONS)[number];

export const INITIAL_OPTIONS: {
  quantity: QuantityOption;
  uppercase: boolean;
} = {
  quantity: 1,
  uppercase: false,
};
