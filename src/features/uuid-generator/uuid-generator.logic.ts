import type { Result } from '@/shared/types';
import type { UuidOptions, UuidResult } from './uuid-generator.types';

const INVALID_QUANTITY_ERROR = 'A quantidade deve estar entre 1 e 100.';

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 100;
}

export function generateUuids(options: UuidOptions): Result<UuidResult> {
  if (!isValidQuantity(options.quantity)) {
    return {
      success: false,
      error: INVALID_QUANTITY_ERROR,
    };
  }

  const uuids = Array.from({ length: options.quantity }, () => {
    const uuid = crypto.randomUUID();

    return options.uppercase ? uuid.toUpperCase() : uuid;
  });

  return {
    success: true,
    data: {
      uuids,
    },
  };
}
