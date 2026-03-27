import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateUuids } from './uuid-generator.logic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVALID_QUANTITY_ERROR = 'A quantidade deve estar entre 1 e 100.';
const MOCK_UUID_PREFIX = '123e4567-e89b-42d3-a456-';

type UuidString = ReturnType<Crypto['randomUUID']>;

function createMockUuid(index: number): UuidString {
  return `${MOCK_UUID_PREFIX}${index.toString(16).padStart(12, '0')}` as UuidString;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('uuid-generator.logic', () => {
  it('gera UUIDs com formato, versao 4 e variant corretos', () => {
    const result = generateUuids({ quantity: 5, uppercase: false });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    result.data.uuids.forEach((uuid) => {
      expect(uuid).toMatch(UUID_REGEX);
      expect(uuid[14]).toBe('4');
      expect(uuid[19]).toMatch(/[89ab]/i);
    });
  });

  it('aplica uppercase quando solicitado', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(createMockUuid(1));

    expect(generateUuids({ quantity: 1, uppercase: true })).toEqual({
      success: true,
      data: {
        uuids: [createMockUuid(1).toUpperCase()],
      },
    });
  });

  it('gera 100 UUIDs unicos', () => {
    const result = generateUuids({ quantity: 100, uppercase: false });

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(new Set(result.data.uuids).size).toBe(100);
  });

  it.each([0, -1, 101, 1.5])('retorna erro quando quantity = %s', (quantity) => {
    expect(generateUuids({ quantity, uppercase: false })).toEqual({
      success: false,
      error: INVALID_QUANTITY_ERROR,
    });
  });
});
