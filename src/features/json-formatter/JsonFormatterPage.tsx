import { useState, type ChangeEvent, type ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
  ClearButton,
  CopyButton,
  Select,
  ToolInput,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import {
  buildValidationOutput,
  formatJson,
  minifyJson,
  validateJson,
} from './json-formatter.logic';
import {
  INDENT_OPTIONS,
  INITIAL_FORMAT_OPTIONS,
  MODE_OPTIONS,
  MODE_ORDER,
  type JsonFormatOptions,
  type JsonMode,
} from './json-formatter.types';

export default function JsonFormatterPage(): ReactElement {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<JsonMode>('format');
  const [formatOptions, setFormatOptions] = useState<JsonFormatOptions>(INITIAL_FORMAT_OPTIONS);
  const activeMode = MODE_OPTIONS[mode];

  const handleChange = (value: string): void => {
    setInput(value);
    setOutput('');
  };

  const handleModeChange = (nextMode: JsonMode): void => {
    setMode(nextMode);
    setOutput('');
  };

  const handleIndentChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    const raw = Number(event.target.value);
    const indent = raw === 2 || raw === 4 ? raw : 2;
    setFormatOptions({ indent });
    setOutput('');
  };

  const handleExecute = (): void => {
    if (mode === 'format') {
      const result = formatJson(input, formatOptions.indent);

      if (!result.success) {
        setOutput(`Erro: ${result.error}`);
        toast({
          message: result.error,
          type: 'error',
        });
        return;
      }

      setOutput(result.data);
      toast({
        message: activeMode.successMessage,
        type: 'success',
      });
      return;
    }

    if (mode === 'validate') {
      const result = validateJson(input);

      if (!result.success) {
        setOutput(`Erro: ${result.error}`);
        toast({
          message: result.error,
          type: 'error',
        });
        return;
      }

      setOutput(buildValidationOutput(result.data.parsed));
      toast({
        message: activeMode.successMessage,
        type: 'success',
      });
      return;
    }

    const result = minifyJson(input);

    if (!result.success) {
      setOutput(`Erro: ${result.error}`);
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    setOutput(result.data);
    toast({
      message: activeMode.successMessage,
      type: 'success',
    });
  };

  const handleClear = (): void => {
    setInput('');
    setOutput('');
    toast({
      message: 'Campos limpos.',
      type: 'info',
    });
  };
  return (
    <ToolPage title="JSON Formatter" description="Formate, valide e minifique JSON" category="data">
      <ToolInput
        label="JSON"
        onChange={handleChange}
        placeholder={'Ex.:\n{\n  "nome": "Dev Toolbox",\n  "ativo": true,\n  "itens": [1, 2, 3]\n}'}
        rows={14}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] lg:items-end">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Modo</span>
              <div aria-label="Modo de operação" className="flex flex-wrap gap-2" role="group">
                {MODE_ORDER.map((optionValue) => (
                  <Button
                    aria-pressed={mode === optionValue}
                    key={optionValue}
                    onClick={() => {
                      handleModeChange(optionValue);
                    }}
                    size="sm"
                    variant={mode === optionValue ? 'primary' : 'secondary'}
                  >
                    {MODE_OPTIONS[optionValue].label}
                  </Button>
                ))}
              </div>
            </div>
            {mode === 'format' ? (
              <Select
                label="Indentação"
                options={INDENT_OPTIONS.map((option) => ({
                  value: option.toString(),
                  label: `${option.toString()} espaços`,
                }))}
                value={formatOptions.indent.toString()}
                onChange={handleIndentChange}
              />
            ) : (
              <div className="hidden lg:block" />
            )}

            <Button onClick={handleExecute} size="lg" variant="primary">
              Executar
            </Button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={activeMode.badgeVariant}>{activeMode.label}</Badge>
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                {activeMode.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <CopyButton text={output} />
              <ClearButton
                disabled={input.length === 0 && output.length === 0}
                onClick={handleClear}
              />
            </div>
          </div>
        </div>
      </Card>

      <ToolOutput copyable={false} label="Resultado" rows={14} value={output} />
    </ToolPage>
  );
}
