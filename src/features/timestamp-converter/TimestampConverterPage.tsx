import { useEffect, useState, type ReactElement } from 'react';
import {
  Badge,
  Button,
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

  const handleClear = (): void => {
    setTimestampInput('');
    setDateInput('');
    toast({ message: 'Campos limpos.', type: 'info' });
  };

  return (
    <ToolPage
      title="Timestamp Converter"
      description="Converta entre timestamps Unix e datas legíveis"
      category="utilities"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--divider-item)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div aria-label="Direção da conversão" className="flex flex-wrap gap-2" role="group">
            {DIRECTION_ORDER.map((optionValue) => (
              <Button
                aria-pressed={direction === optionValue}
                key={optionValue}
                onClick={() => {
                  setDirection(optionValue);
                }}
                size="sm"
                variant={direction === optionValue ? 'primary' : 'ghost'}
              >
                {DIRECTION_OPTIONS[optionValue].label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-[var(--color-text-muted)]">{activeDirection.description}</p>
            {direction === 'timestamp-to-date' && timestampOutput.unit !== null ? (
              <Badge variant={UNIT_OPTIONS[timestampOutput.unit].variant}>
                {UNIT_OPTIONS[timestampOutput.unit].label}
              </Badge>
            ) : null}
          </div>
        </div>

        <ClearButton disabled={!hasInput} onClick={handleClear} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {direction === 'timestamp-to-date' ? (
          <ToolInput
            label={activeDirection.inputLabel}
            onChange={setTimestampInput}
            placeholder={activeDirection.inputPlaceholder}
            rows={8}
            value={timestampInput}
          />
        ) : (
          <ToolInput
            label={activeDirection.inputLabel}
            monospace={false}
            onChange={setDateInput}
            placeholder={activeDirection.inputPlaceholder}
            rows={8}
            value={dateInput}
          />
        )}

        <ToolOutput
          copyable={activeOutput.copyable}
          label={activeDirection.outputLabel}
          rows={8}
          value={activeOutput.value}
        />
      </div>

      <section className="border-t border-[var(--divider-section)] pt-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-sm font-medium">Agora</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {formatCurrentLocalDate(currentTimestamp.milliseconds)}
            {browserTimeZone ? ` (${browserTimeZone})` : ''}
          </p>
        </div>

        <dl className="mt-4 divide-y divide-[var(--divider-item)] border-y border-[var(--divider-item)]">
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">
                Segundos
              </dt>
              <dd className="mt-1 font-mono text-sm text-[var(--color-text)]">
                {String(currentTimestamp.seconds)}
              </dd>
            </div>
            <CopyButton size="sm" text={String(currentTimestamp.seconds)} />
          </div>

          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.08em] text-[var(--color-text-subtle)]">
                Milissegundos
              </dt>
              <dd className="mt-1 font-mono text-sm text-[var(--color-text)]">
                {String(currentTimestamp.milliseconds)}
              </dd>
            </div>
            <CopyButton size="sm" text={String(currentTimestamp.milliseconds)} />
          </div>
        </dl>
      </section>
    </ToolPage>
  );
}
