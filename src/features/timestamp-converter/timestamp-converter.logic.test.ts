import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  dateToTimestamp,
  detectUnit,
  getCurrentTimestamp,
  timestampToDate,
} from './timestamp-converter.logic';

function getExpectedLocalDate(milliseconds: number): string {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Date(milliseconds).toLocaleString('pt-BR', timeZone ? { timeZone } : undefined);
}

describe('timestamp-converter.logic', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('converte o timestamp 0 para a data inicial da epoch', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1970-01-01T00:00:10.000Z'));

    expect(timestampToDate(0, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '1970-01-01T00:00:00.000Z',
        utc: 'Thu, 01 Jan 1970 00:00:00 GMT',
        local: getExpectedLocalDate(0),
        relative: 'ha 10 segundos',
      },
    });
  });

  it('converte 1700000000 em segundos para novembro de 2023', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-11-14T22:13:20.000Z'));

    expect(timestampToDate(1_700_000_000, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '2023-11-14T22:13:20.000Z',
        utc: 'Tue, 14 Nov 2023 22:13:20 GMT',
        local: getExpectedLocalDate(1_700_000_000_000),
        relative: 'agora',
      },
    });
  });

  it('converte 1700000000000 em milissegundos para a mesma data', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-11-14T22:13:20.000Z'));

    expect(timestampToDate(1_700_000_000_000, 'milliseconds')).toEqual({
      success: true,
      data: {
        iso: '2023-11-14T22:13:20.000Z',
        utc: 'Tue, 14 Nov 2023 22:13:20 GMT',
        local: getExpectedLocalDate(1_700_000_000_000),
        relative: 'agora',
      },
    });
  });

  it('detecta segundos para 1700000000', () => {
    expect(detectUnit(1_700_000_000)).toBe('seconds');
  });

  it('detecta milissegundos para 1700000000000', () => {
    expect(detectUnit(1_700_000_000_000)).toBe('milliseconds');
  });

  it('retorna erro para string de data invalida', () => {
    expect(dateToTimestamp('nao-e-data')).toEqual({
      success: false,
      error: 'Informe uma data valida.',
    });
  });

  it('retorna erro para data vazia', () => {
    expect(dateToTimestamp('   ')).toEqual({
      success: false,
      error: 'Informe uma data valida.',
    });
  });

  it('converte 2024-01-01 para timestamps em segundos e milissegundos', () => {
    expect(dateToTimestamp('2024-01-01')).toEqual({
      success: true,
      data: {
        seconds: 1_704_067_200,
        milliseconds: 1_704_067_200_000,
      },
    });
  });

  it('aceita timestamp negativo e retorna data anterior a 1970', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1970-01-01T00:00:00.000Z'));

    expect(timestampToDate(-1, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '1969-12-31T23:59:59.000Z',
        utc: 'Wed, 31 Dec 1969 23:59:59 GMT',
        local: getExpectedLocalDate(-1_000),
        relative: 'ha 1 segundo',
      },
    });
  });

  it('gera texto relativo futuro quando o timestamp esta a frente do horario atual', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('1970-01-01T00:00:00.000Z'));

    expect(timestampToDate(1, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '1970-01-01T00:00:01.000Z',
        utc: 'Thu, 01 Jan 1970 00:00:01 GMT',
        local: getExpectedLocalDate(1_000),
        relative: 'em 1 segundo',
      },
    });
  });

  it('retorna erro para timestamp NaN', () => {
    expect(timestampToDate(Number.NaN, 'seconds')).toEqual({
      success: false,
      error: 'Informe um timestamp valido.',
    });
  });

  it('retorna erro para timestamp finito fora do intervalo valido do Date', () => {
    expect(timestampToDate(9e15, 'milliseconds')).toEqual({
      success: false,
      error: 'Informe um timestamp valido.',
    });
  });

  it('gera texto relativo em minutos, horas e dias', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));

    expect(timestampToDate(1_704_887_880, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '2024-01-10T11:58:00.000Z',
        utc: 'Wed, 10 Jan 2024 11:58:00 GMT',
        local: getExpectedLocalDate(1_704_887_880_000),
        relative: 'ha 2 minutos',
      },
    });

    expect(timestampToDate(1_704_880_800, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '2024-01-10T10:00:00.000Z',
        utc: 'Wed, 10 Jan 2024 10:00:00 GMT',
        local: getExpectedLocalDate(1_704_880_800_000),
        relative: 'ha 2 horas',
      },
    });

    expect(timestampToDate(1_704_628_800, 'seconds')).toEqual({
      success: true,
      data: {
        iso: '2024-01-07T12:00:00.000Z',
        utc: 'Sun, 07 Jan 2024 12:00:00 GMT',
        local: getExpectedLocalDate(1_704_628_800_000),
        relative: 'ha 3 dias',
      },
    });
  });

  it('retorna timestamp atual em segundos e milissegundos', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.123Z'));

    expect(getCurrentTimestamp()).toEqual({
      seconds: 1_704_067_200,
      milliseconds: 1_704_067_200_123,
    });
  });
});
