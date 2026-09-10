import { useState, type ReactElement } from 'react';
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
import { validateCnpj } from './cnpj-validator.logic';
import type { CnpjValidationResult } from './cnpj-validator.types';

function buildOutput(validationResult: CnpjValidationResult): string {
  return [
    `CNPJ formatado: ${validationResult.formatted}`,
    `Status: ${validationResult.valid ? 'CNPJ valido' : 'CNPJ invalido'}`,
  ].join('\n');
}

export default function CnpjValidatorPage(): ReactElement {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validationResult, setValidationResult] = useState<CnpjValidationResult | null>(null);

  const handleChange = (value: string): void => {
    setInput(value);
    setOutput('');
    setValidationResult(null);
  };

  const handleValidate = (): void => {
    const result = validateCnpj(input);

    if (!result.success) {
      setOutput('');
      setValidationResult(null);
      toast({ message: result.error, type: 'error' });
      return;
    }

    setValidationResult(result.data);
    setOutput(buildOutput(result.data));
    toast({
      message: result.data.valid ? 'CNPJ valido.' : 'CNPJ invalido.',
      type: result.data.valid ? 'success' : 'error',
    });
  };

  const handleClear = (): void => {
    setInput('');
    setOutput('');
    setValidationResult(null);
    toast({ message: 'Campos limpos.', type: 'info' });
  };

  return (
    <ToolPage
      title="Validador de CNPJ"
      description="Valide formato e dígitos verificadores de um CNPJ"
      category="documents"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--divider-item)] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-8">
          {validationResult !== null ? (
            <Badge variant={validationResult.valid ? 'success' : 'error'}>
              {validationResult.valid ? 'Válido' : 'Inválido'}
            </Badge>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Informe um CNPJ com ou sem máscara.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClearButton disabled={input.length === 0 && output.length === 0} onClick={handleClear} />
          <CopyButton text={output} />
          <Button onClick={handleValidate} variant="primary">
            Validar
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ToolInput
          label="CNPJ"
          onChange={handleChange}
          placeholder="Ex.: 11.222.333/0001-81 ou 11222333000181"
          rows={6}
          value={input}
        />
        <ToolOutput copyable={false} label="Resultado da validação" rows={6} value={output} />
      </div>
    </ToolPage>
  );
}
