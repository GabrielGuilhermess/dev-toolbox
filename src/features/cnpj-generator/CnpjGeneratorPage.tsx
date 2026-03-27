import {
  useState,
  type ChangeEvent,
  type ReactElement,
} from 'react';
import {
  Button,
  Card,
  ClearButton,
  CopyButton,
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
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    setGeneratedCnpjs(result.data.cnpjs);
    toast({
      message: 'CNPJs gerados com sucesso.',
      type: 'success',
    });
  };

  const handleFormattedChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { checked } = event.target;

    setOptions((currentOptions) => ({
      ...currentOptions,
      formatted: checked,
    }));
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const quantity = Number(event.target.value);

    setOptions((currentOptions) => ({
      ...currentOptions,
      quantity,
    }));
  };

  const handleClear = (): void => {
    setGeneratedCnpjs([]);
    toast({
      message: 'Resultado limpo.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="Gerador de CNPJ"
      description="Gere CNPJs validos para testes e desenvolvimento"
      category="documents"
    >
      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="cnpj-generator-quantity">
                  Quantidade
                </label>
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                  id="cnpj-generator-quantity"
                  onChange={handleQuantityChange}
                  value={options.quantity}
                >
                  {QUANTITY_OPTIONS.map((quantityOption) => (
                    <option key={quantityOption} value={quantityOption}>
                      {quantityOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Formato</span>
                <label
                  className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] shadow-sm"
                  htmlFor="cnpj-generator-formatted"
                >
                  <input
                    checked={options.formatted}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    id="cnpj-generator-formatted"
                    onChange={handleFormattedChange}
                    type="checkbox"
                  />
                  Gerar com mascara
                </label>
              </div>
            </div>

            <Button onClick={handleGenerate} size="lg" variant="primary">
              Gerar
            </Button>
          </div>

          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Ajuste as opções e gere CNPJs únicos para testes, seeds e cenários de
            homologação.
          </p>
        </div>
      </Card>

      <ToolOutput
        copyable={false}
        label="Parâmetros da geração"
        monospace={false}
        rows={3}
        value={formatCnpjGeneratorOptions(options)}
      />

      <ToolOutput copyable={false} label="CNPJs gerados" rows={10} value={output} />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <CopyButton text={output} />
          <ClearButton disabled={generatedCnpjs.length === 0} onClick={handleClear} />
        </div>
      </Card>
    </ToolPage>
  );
}
