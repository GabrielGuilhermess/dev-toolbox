export interface DateInfo {
  iso: string;
  utc: string;
  local: string;
  relative: string;
}

export type TimestampUnit = 'seconds' | 'milliseconds';

export type ConversionDirection = 'timestamp-to-date' | 'date-to-timestamp';

export interface OutputState {
  value: string;
  copyable: boolean;
}

export interface TimestampOutputState extends OutputState {
  unit: TimestampUnit | null;
}

interface DirectionOption {
  label: string;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  outputLabel: string;
  badgeVariant: 'info' | 'warning';
}

interface UnitOption {
  label: string;
  variant: 'info' | 'warning';
}

export const DIRECTION_OPTIONS = {
  'timestamp-to-date': {
    label: 'Timestamp para Data',
    description: 'Cole um timestamp Unix e veja o valor em ISO, UTC, horario local e tempo relativo.',
    inputLabel: 'Timestamp Unix',
    inputPlaceholder: 'Ex.:\n1700000000\n1700000000000\n-1',
    outputLabel: 'Data convertida',
    badgeVariant: 'info',
  },
  'date-to-timestamp': {
    label: 'Data para Timestamp',
    description:
      'Informe uma data reconhecida pelo navegador para obter os valores em segundos e milissegundos.',
    inputLabel: 'Data ou horario',
    inputPlaceholder: 'Ex.:\n2024-01-01\n2024-01-01T15:30:00Z\n2024-01-01T12:30:00-03:00',
    outputLabel: 'Timestamps gerados',
    badgeVariant: 'warning',
  },
} satisfies Record<ConversionDirection, DirectionOption>;

export const DIRECTION_ORDER = ['timestamp-to-date', 'date-to-timestamp'] as const satisfies readonly ConversionDirection[];

export const UNIT_OPTIONS = {
  seconds: {
    label: 'segundos',
    variant: 'info',
  },
  milliseconds: {
    label: 'milissegundos',
    variant: 'warning',
  },
} satisfies Record<TimestampUnit, UnitOption>;
