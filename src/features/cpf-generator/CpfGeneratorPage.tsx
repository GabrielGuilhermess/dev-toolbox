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
import { formatCpfGeneratorOptions, generateCpf } from './cpf-generator.logic';
import { INITIAL_OPTIONS, QUANTITY_OPTIONS, type CpfGeneratorOptions } from './cpf-generator.types';

export default function CpfGeneratorPage(): ReactElement {
  const { toast } = useToast();
  const [options, setOptions] = useState<CpfGeneratorOptions>(INITIAL_OPTIONS);
  const [generatedCpfs, setGeneratedCpfs] = useState<string[]>([]);

  const output = generatedCpfs.join('\n');

  const handleGenerate = (): void => {
    const result = generateCpf(options);

    if (!result.success) {
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    setGeneratedCpfs(result.data.cpfs);
    toast({
      message: 'CPFs gerados com sucesso.',
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
    setGeneratedCpfs([]);
    toast({
      message: 'Resultado limpo.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="Gerador de CPF"
      description="Gere CPFs validos para testes e desenvolvimento"
      category="documents"
    >
      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold" htmlFor="cpf-generator-quantity">
                  Quantidade
                </label>
                <select
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text)] shadow-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]"
                  id="cpf-generator-quantity"
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
                  htmlFor="cpf-generator-formatted"
                >
                  <input
                    checked={options.formatted}
                    className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]/20"
                    id="cpf-generator-formatted"
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
            Ajuste as opções e gere CPFs únicos para cenários de teste, seed de banco e mocks.
          </p>
        </div>
      </Card>

      <ToolOutput
        copyable={false}
        label="Parâmetros da geração"
        monospace={false}
        rows={3}
        value={formatCpfGeneratorOptions(options)}
      />

      <ToolOutput copyable={false} label="CPFs gerados" rows={10} value={output} />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <CopyButton text={output} />
          <ClearButton disabled={generatedCpfs.length === 0} onClick={handleClear} />
        </div>
      </Card>
    </ToolPage>
  );
}
