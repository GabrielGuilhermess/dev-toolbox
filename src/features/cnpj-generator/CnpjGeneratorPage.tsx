import { useState, type ChangeEvent, type ReactElement } from 'react';
import {
  Button,
  ClearButton,
  CopyButton,
  Select,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import { formatCnpjGeneratorOptions, generateCnpj } from './cnpj-generator.logic';
import { INITIAL_OPTIONS, QUANTITY_OPTIONS, type CnpjGeneratorOptions } from './cnpj-generator.types';

export default function CnpjGeneratorPage(): ReactElement {
  const { toast } = useToast();
  const [options, setOptions] = useState<CnpjGeneratorOptions>(INITIAL_OPTIONS);
  const [generatedCnpjs, setGeneratedCnpjs] = useState<string[]>([]);

  const output = generatedCnpjs.join('\n');

  const handleGenerate = (): void => {
    const result = generateCnpj(options);

    if (!result.success) {
      toast({ message: result.error, type: 'error' });
      return;
    }

    setGeneratedCnpjs(result.data.cnpjs);
    toast({ message: 'CNPJs gerados com sucesso.', type: 'success' });
  };

  const handleFormattedChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = event.target;
    setOptions((currentOptions) => ({ ...currentOptions, formatted: checked }));
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const quantity = Number(event.target.value);
    setOptions((currentOptions) => ({ ...currentOptions, quantity }));
  };

  const handleClear = (): void => {
    setGeneratedCnpjs([]);
    toast({ message: 'Resultado limpo.', type: 'info' });
  };

  return (
    <ToolPage
      title="Gerador de CNPJ"
      description="Gere CNPJs válidos para testes e desenvolvimento"
      category="documents"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--divider-item)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-[10rem_auto] sm:items-end">
          <Select
            controlSize="md"
            id="cnpj-generator-quantity"
            label="Quantidade"
            onChange={handleQuantityChange}
            options={QUANTITY_OPTIONS.map((quantityOption) => ({
              value: quantityOption,
              label: String(quantityOption),
            }))}
            value={options.quantity}
          />

          <label
            className="flex min-h-10 items-center gap-2 text-sm text-[var(--color-text)]"
            htmlFor="cnpj-generator-formatted"
          >
            <input
              checked={options.formatted}
              className="h-4 w-4 accent-[var(--color-primary)]"
              id="cnpj-generator-formatted"
              onChange={handleFormattedChange}
              type="checkbox"
            />
            Gerar com mascara
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClearButton disabled={generatedCnpjs.length === 0} onClick={handleClear} />
          <CopyButton text={output} />
          <Button onClick={handleGenerate} variant="primary">
            Gerar
          </Button>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--color-text-muted)]">
        Ajuste a quantidade e o formato antes de gerar os valores.
      </p>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
        <ToolOutput
          copyable={false}
          label="Parâmetros da geração"
          monospace={false}
          rows={3}
          value={formatCnpjGeneratorOptions(options)}
        />
        <ToolOutput copyable={false} label="CNPJs gerados" rows={10} value={output} />
      </div>
    </ToolPage>
  );
}
