import { useState, type ReactElement } from 'react';
import { Button, ClearButton, CopyButton, ToolInput, ToolOutput, ToolPage } from '@/shared/components';
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
      toast({ message: result.error, type: 'error' });
      return;
    }
    setOutput(result.data);
    toast({ message: activeMode.successMessage, type: 'success' });
  };

  const handleClear = (): void => {
    setInput('');
    setOutput('');
    toast({ message: 'Campos limpos.', type: 'info' });
  };

  return (
    <ToolPage
      title="URL Codec"
      description="Codifica e decodifica strings para uso em URLs"
      category="data"
    >
      <div className="flex flex-col gap-4 border-b border-[var(--divider-item)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div aria-label="Modo de operação" className="flex flex-wrap gap-2" role="group">
            {MODE_ORDER.map((optionValue) => (
              <Button
                aria-pressed={mode === optionValue}
                key={optionValue}
                onClick={() => {
                  handleModeChange(optionValue);
                }}
                size="sm"
                variant={mode === optionValue ? 'primary' : 'ghost'}
              >
                {MODE_OPTIONS[optionValue].label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">{activeMode.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClearButton disabled={input.length === 0 && output.length === 0} onClick={handleClear} />
          <CopyButton text={output} />
          <Button onClick={handleExecute} variant="primary">
            Executar
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ToolInput
          label={activeMode.inputLabel}
          onChange={handleChange}
          placeholder={activeMode.placeholder}
          rows={18}
          value={input}
        />
        <ToolOutput copyable={false} label="Resultado" rows={18} value={output} />
      </div>
    </ToolPage>
  );
}
