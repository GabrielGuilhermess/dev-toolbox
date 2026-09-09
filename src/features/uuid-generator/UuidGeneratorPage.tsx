import { useId, useState, type ChangeEvent, type ReactElement } from 'react';
import {
  Button,
  ClearButton,
  CopyButton,
  Select,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import { generateUuids } from './uuid-generator.logic';
import { INITIAL_OPTIONS, QUANTITY_OPTIONS, type QuantityOption } from './uuid-generator.types';

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
    const nextQuantity = QUANTITY_OPTIONS.find((option) => option === raw) ?? 1;
    setQuantity(nextQuantity);
  };

  const handleUppercaseChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setUppercase(event.target.checked);
  };

  const handleGenerate = (): void => {
    const result = generateUuids({ quantity, uppercase });

    if (!result.success) {
      toast({ message: result.error, type: 'error' });
      return;
    }

    setUuids(result.data.uuids);
    const successMessage =
      quantity === 1 ? '1 UUID gerado com sucesso.' : `${String(quantity)} UUIDs gerados com sucesso.`;
    toast({ message: successMessage, type: 'success' });
  };

  const handleClear = (): void => {
    setQuantity(INITIAL_OPTIONS.quantity);
    setUppercase(INITIAL_OPTIONS.uppercase);
    setUuids([]);
    toast({ message: 'UUIDs limpos.', type: 'info' });
  };

  return (
    <ToolPage title="UUID Generator" description="Gere UUIDs v4 aleatórios" category="utilities">
      <div className="flex flex-col gap-4 border-b border-[var(--divider-item)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-[10rem_auto] sm:items-end">
          <Select
            controlSize="md"
            id={quantityId}
            label="Quantidade"
            onChange={handleQuantityChange}
            options={QUANTITY_OPTIONS.map((option) => ({ value: option, label: String(option) }))}
            value={quantity}
          />

          <label
            className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-text)]"
            htmlFor={uppercaseId}
          >
            <input
              checked={uppercase}
              className="h-4 w-4 accent-[var(--color-primary)]"
              id={uppercaseId}
              onChange={handleUppercaseChange}
              type="checkbox"
            />
            Gerar em maiúsculas
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClearButton
            disabled={
              quantity === INITIAL_OPTIONS.quantity &&
              uppercase === INITIAL_OPTIONS.uppercase &&
              uuids.length === 0
            }
            onClick={handleClear}
          />
          <Button onClick={handleGenerate} variant="primary">
            Gerar
          </Button>
        </div>
      </div>

      <ToolOutput label="UUIDs gerados" rows={12} value={outputValue} />

      {uuids.length > 0 ? (
        <section className="border-t border-[var(--divider-item)] pt-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium">Resultados individuais</h2>
            <span className="font-mono text-xs text-[var(--color-text-subtle)]">
              {uuids.length} {uuids.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <ul className="divide-y divide-[var(--divider-item)] border-y border-[var(--divider-item)]">
            {uuids.map((uuid) => (
              <li
                className="flex min-w-0 items-center justify-between gap-3 py-3"
                key={uuid}
              >
                <code className="min-w-0 overflow-x-auto font-mono text-sm leading-6 text-[var(--color-text)]">
                  {uuid}
                </code>
                <CopyButton size="sm" text={uuid} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </ToolPage>
  );
}
