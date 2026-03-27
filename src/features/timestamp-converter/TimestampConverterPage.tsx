import { useEffect, useState, type ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
  ClearButton,
  CopyButton,
  ToolInput,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import {
  buildDateOutputState,
  buildTimestampOutputState,
  formatCurrentLocalDate,
  getBrowserTimeZone,
  getCurrentTimestamp,
} from './timestamp-converter.logic';
import {
  DIRECTION_OPTIONS,
  DIRECTION_ORDER,
  UNIT_OPTIONS,
  type ConversionDirection,
} from './timestamp-converter.types';

export default function TimestampConverterPage(): ReactElement {
  const { toast } = useToast();
  const [direction, setDirection] = useState<ConversionDirection>('timestamp-to-date');
  const [timestampInput, setTimestampInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [currentTimestamp, setCurrentTimestamp] = useState(getCurrentTimestamp());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(getCurrentTimestamp());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const activeDirection = DIRECTION_OPTIONS[direction];
  const timestampOutput = buildTimestampOutputState(timestampInput);
  const dateOutput = buildDateOutputState(dateInput);
  const activeOutput = direction === 'timestamp-to-date' ? timestampOutput : dateOutput;
  const browserTimeZone = getBrowserTimeZone();
  const hasInput = timestampInput.trim().length > 0 || dateInput.trim().length > 0;

  const handleDirectionChange = (nextDirection: ConversionDirection): void => {
    setDirection(nextDirection);
  };

  const handleTimestampChange = (value: string): void => {
    setTimestampInput(value);
  };

  const handleDateChange = (value: string): void => {
    setDateInput(value);
  };

  const handleClear = (): void => {
    setTimestampInput('');
    setDateInput('');
    toast({
      message: 'Campos limpos.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="Timestamp Converter"
      description="Converta entre timestamps Unix e datas legiveis"
      category="utilities"
    >
      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Direção</span>
            <div
              aria-label="Direção da conversão"
              className="flex flex-wrap gap-2"
              role="group"
            >
              {DIRECTION_ORDER.map((optionValue) => (
                <Button
                  aria-pressed={direction === optionValue}
                  key={optionValue}
                  onClick={() => {
                    handleDirectionChange(optionValue);
                  }}
                  size="sm"
                  variant={direction === optionValue ? 'primary' : 'secondary'}
                >
                  {DIRECTION_OPTIONS[optionValue].label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={activeDirection.badgeVariant}>{activeDirection.label}</Badge>

              {direction === 'timestamp-to-date' && timestampOutput.unit !== null ? (
                <Badge variant={UNIT_OPTIONS[timestampOutput.unit].variant}>
                  {UNIT_OPTIONS[timestampOutput.unit].label}
                </Badge>
              ) : null}

              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                {activeDirection.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <ClearButton disabled={!hasInput} onClick={handleClear} />
            </div>
          </div>
        </div>
      </Card>

      {direction === 'timestamp-to-date' ? (
        <ToolInput
          label={activeDirection.inputLabel}
          onChange={handleTimestampChange}
          placeholder={activeDirection.inputPlaceholder}
          rows={6}
          value={timestampInput}
        />
      ) : (
        <ToolInput
          label={activeDirection.inputLabel}
          monospace={false}
          onChange={handleDateChange}
          placeholder={activeDirection.inputPlaceholder}
          rows={6}
          value={dateInput}
        />
      )}

      <ToolOutput
        copyable={activeOutput.copyable}
        label={activeDirection.outputLabel}
        rows={direction === 'timestamp-to-date' ? 8 : 5}
        value={activeOutput.value}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold">Agora</h2>
              <Badge variant="success">ao vivo</Badge>
            </div>

            <p className="text-sm leading-6 text-[var(--color-text-muted)]">
              {formatCurrentLocalDate(currentTimestamp.milliseconds)}
              {browserTimeZone ? ` (${browserTimeZone})` : ''}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-output-bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                Segundos
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="overflow-x-auto font-mono text-sm leading-6 text-[var(--color-text)]">
                  {String(currentTimestamp.seconds)}
                </code>
                <CopyButton size="sm" text={String(currentTimestamp.seconds)} />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-output-bg)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                Milissegundos
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <code className="overflow-x-auto font-mono text-sm leading-6 text-[var(--color-text)]">
                  {String(currentTimestamp.milliseconds)}
                </code>
                <CopyButton size="sm" text={String(currentTimestamp.milliseconds)} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </ToolPage>
  );
}
