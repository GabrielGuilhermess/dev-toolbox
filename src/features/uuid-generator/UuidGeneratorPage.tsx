import { useId, useState, type ChangeEvent, type ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
  ClearButton,
  CopyButton,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import { generateUuids } from './uuid-generator.logic';
import { INITIAL_OPTIONS, QUANTITY_OPTIONS, type QuantityOption } from './uuid-generator.types';

const selectClassName =
  'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]';

export default function UuidGeneratorPage(): ReactElement {
  const quantityId = useId();
  const uppercaseId = useId();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState<QuantityOption>(INITIAL_OPTIONS.quantity);
  const [uppercase, setUppercase] = useState<boolean>(INITIAL_OPTIONS.uppercase);
  const [uuids, setUuids] = useState<string[]>([]);

  const outputValue = uuids.join('\n');

  const handleQuantityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const raw = Number(event.target.value);
    const quantity = QUANTITY_OPTIONS.find((option) => option === raw) ?? 1;

    setQuantity(quantity);
  };

  const handleUppercaseChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUppercase(event.target.checked);
  };

  const handleGenerate = (): void => {
    const result = generateUuids({ quantity, uppercase });

    if (!result.success) {
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    setUuids(result.data.uuids);
    const successMessage =
      quantity === 1 ? '1 UUID gerado com sucesso.' : `${String(quantity)} UUIDs gerados com sucesso.`;

    toast({
      message: successMessage,
      type: 'success',
    });
  };

  const handleClear = (): void => {
    setQuantity(INITIAL_OPTIONS.quantity);
    setUppercase(INITIAL_OPTIONS.uppercase);
    setUuids([]);
    toast({
      message: 'UUIDs limpos.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="UUID Generator"
      description="Gere UUIDs v4 aleatorios"
      category="utilities"
    >
      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor={quantityId}>
                Quantidade
              </label>
              <select
                className={selectClassName}
                id={quantityId}
                onChange={handleQuantityChange}
                value={String(quantity)}
              >
                {QUANTITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Formato</span>

              <label
                className="flex min-h-14 items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm"
                htmlFor={uppercaseId}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text)]">
                    Gerar em maiúsculas
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {uppercase ? 'Formato atual: MAIÚSCULAS' : 'Formato atual: minúsculas'}
                  </span>
                </div>

                <input
                  checked={uppercase}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                  id={uppercaseId}
                  onChange={handleUppercaseChange}
                  type="checkbox"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">
                {quantity} {quantity === 1 ? 'UUID' : 'UUIDs'}
              </Badge>
              <Badge variant={uppercase ? 'warning' : 'info'}>
                {uppercase ? 'Maiusculas' : 'Minusculas'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button onClick={handleGenerate} size="lg" variant="primary">
                Gerar
              </Button>
              <ClearButton
                disabled={
                  quantity === INITIAL_OPTIONS.quantity &&
                  uppercase === INITIAL_OPTIONS.uppercase &&
                  uuids.length === 0
                }
                onClick={handleClear}
              />
            </div>
          </div>
        </div>
      </Card>

      <ToolOutput label="UUIDs gerados" rows={12} value={outputValue} />

      {uuids.length > 0 ? (
        <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lista gerada</h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                Copie um UUID individualmente ou use o botao da area de saida para copiar todos.
              </p>
            </div>
          </div>

          <ul className="grid gap-3">
            {uuids.map((uuid) => (
              <li
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-output-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
                key={uuid}
              >
                <code className="overflow-x-auto font-mono text-sm leading-6 text-[var(--color-text)]">
                  {uuid}
                </code>
                <CopyButton size="sm" text={uuid} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </ToolPage>
  );
}
