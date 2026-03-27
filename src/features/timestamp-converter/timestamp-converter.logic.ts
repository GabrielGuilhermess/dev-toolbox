import type { Result } from '@/shared/types';
import type {
  DateInfo,
  OutputState,
  TimestampOutputState,
  TimestampUnit,
} from './timestamp-converter.types';

export const INVALID_TIMESTAMP_ERROR = 'Informe um timestamp valido.';
const INVALID_DATE_ERROR = 'Informe uma data valida.';
const SECOND_IN_MS = 1000;
const MINUTE_IN_SECONDS = 60;
const HOUR_IN_SECONDS = 60 * MINUTE_IN_SECONDS;
const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;

export function getBrowserTimeZone(): string | undefined {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function formatLocalDate(date: Date): string {
  const timeZone = getBrowserTimeZone();

  return date.toLocaleString('pt-BR', timeZone ? { timeZone } : undefined);
}

function pluralize(value: number, label: string): string {
  return value === 1 ? label : `${label}s`;
}

function formatRelativeDate(timestampInMilliseconds: number): string {
  const now = Date.now();
  const differenceInSeconds = Math.floor(Math.abs(now - timestampInMilliseconds) / SECOND_IN_MS);
  const prefix = now >= timestampInMilliseconds ? 'ha' : 'em';

  if (differenceInSeconds === 0) {
    return 'agora';
  }

  if (differenceInSeconds < MINUTE_IN_SECONDS) {
    return `${prefix} ${String(differenceInSeconds)} ${pluralize(differenceInSeconds, 'segundo')}`;
  }

  let value = Math.floor(differenceInSeconds / MINUTE_IN_SECONDS);
  let label = pluralize(value, 'minuto');

  if (differenceInSeconds >= DAY_IN_SECONDS) {
    value = Math.floor(differenceInSeconds / DAY_IN_SECONDS);
    label = pluralize(value, 'dia');
  } else if (differenceInSeconds >= HOUR_IN_SECONDS) {
    value = Math.floor(differenceInSeconds / HOUR_IN_SECONDS);
    label = pluralize(value, 'hora');
  }

  return `${prefix} ${String(value)} ${label}`;
}

function formatDateInfoOutput(dateInfo: DateInfo): string {
  return [`ISO: ${dateInfo.iso}`, `UTC: ${dateInfo.utc}`, `Local: ${dateInfo.local}`, `Relativo: ${dateInfo.relative}`].join('\n');
}

function formatTimestampOutput(data: { seconds: number; milliseconds: number }): string {
  return [`Segundos: ${String(data.seconds)}`, `Milissegundos: ${String(data.milliseconds)}`].join('\n');
}

export function formatCurrentLocalDate(milliseconds: number): string {
  const date = new Date(milliseconds);
  const timeZone = getBrowserTimeZone();

  return date.toLocaleString('pt-BR', timeZone ? { timeZone } : undefined);
}

export function buildTimestampOutputState(input: string): TimestampOutputState {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return { value: '', copyable: false, unit: null };
  }

  const parsedTimestamp = Number(normalizedInput);

  if (!Number.isFinite(parsedTimestamp)) {
    return { value: `Erro: ${INVALID_TIMESTAMP_ERROR}`, copyable: false, unit: null };
  }

  const unit = detectUnit(parsedTimestamp);
  const result = timestampToDate(parsedTimestamp, unit);

  if (!result.success) {
    return { value: `Erro: ${result.error}`, copyable: false, unit };
  }

  return { value: formatDateInfoOutput(result.data), copyable: true, unit };
}

export function buildDateOutputState(input: string): OutputState {
  const normalizedInput = input.trim();

  if (normalizedInput.length === 0) {
    return { value: '', copyable: false };
  }

  const result = dateToTimestamp(normalizedInput);

  if (!result.success) {
    return { value: `Erro: ${result.error}`, copyable: false };
  }

  return { value: formatTimestampOutput(result.data), copyable: true };
}

export function timestampToDate(ts: number, unit: TimestampUnit): Result<DateInfo> {
  if (!Number.isFinite(ts)) {
    return { success: false, error: INVALID_TIMESTAMP_ERROR };
  }

  const timestampInMilliseconds = unit === 'seconds' ? ts * SECOND_IN_MS : ts;
  const date = new Date(timestampInMilliseconds);

  if (Number.isNaN(date.getTime())) {
    return { success: false, error: INVALID_TIMESTAMP_ERROR };
  }

  return {
    success: true,
    data: {
      iso: date.toISOString(),
      utc: date.toUTCString(),
      local: formatLocalDate(date),
      relative: formatRelativeDate(timestampInMilliseconds),
    },
  };
}

export function dateToTimestamp(
  dateStr: string,
): Result<{ seconds: number; milliseconds: number }> {
  const normalizedDate = dateStr.trim();

  if (normalizedDate.length === 0) {
    return { success: false, error: INVALID_DATE_ERROR };
  }

  const date = new Date(normalizedDate);

  if (Number.isNaN(date.getTime())) {
    return { success: false, error: INVALID_DATE_ERROR };
  }

  const milliseconds = date.getTime();

  return {
    success: true,
    data: {
      seconds: milliseconds / SECOND_IN_MS,
      milliseconds,
    },
  };
}

export function detectUnit(ts: number): TimestampUnit {
  return ts > 1e12 ? 'milliseconds' : 'seconds';
}

export function getCurrentTimestamp(): { seconds: number; milliseconds: number } {
  const now = Date.now();

  return {
    seconds: Math.floor(now / SECOND_IN_MS),
    milliseconds: now,
  };
}
