import { useState, type ReactElement } from 'react';
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
import { decodeUrl, encodeUrl } from './url-codec.logic';
import { MODE_OPTIONS, MODE_ORDER, type UrlMode } from './url-codec.types';

export default function UrlCodecPage(): ReactElement {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<UrlMode>('encode');

  const activeMode = MODE_OPTIONS[mode];

  const handleChange = (value: string): void => {
    setInput(value);
    setOutput('');
  };

  const handleModeChange = (nextMode: UrlMode): void => {
    setMode(nextMode);
    setOutput('');
  };

  const handleExecute = (): void => {
    const result = mode === 'encode' ? encodeUrl(input) : decodeUrl(input);

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
    <ToolPage
      title="URL Encode/Decode"
      description="Encode e decode strings para uso em URLs"
      category="data"
    >
      <ToolInput
        label={activeMode.inputLabel}
        onChange={handleChange}
        placeholder={activeMode.placeholder}
        rows={14}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
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
