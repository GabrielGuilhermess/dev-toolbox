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
import { validateCpf } from './cpf-validator.logic';
import type { CpfValidationResult } from './cpf-validator.types';

function buildOutput(validationResult: CpfValidationResult): string {
  return [
    `CPF formatado: ${validationResult.formatted}`,
    `Status: ${validationResult.valid ? 'CPF valido' : 'CPF invalido'}`,
    `Primeiro digito verificador: ${String(validationResult.digits.first)}`,
    `Segundo digito verificador: ${String(validationResult.digits.second)}`,
  ].join('\n');
}

export default function CpfValidatorPage(): ReactElement {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validationResult, setValidationResult] = useState<CpfValidationResult | null>(null);

  const handleChange = (value: string): void => {
    setInput(value);
    setOutput('');
    setValidationResult(null);
  };

  const handleValidate = (): void => {
    const result = validateCpf(input);

    if (!result.success) {
      setOutput('');
      setValidationResult(null);
      toast({ message: result.error, type: 'error' });
      return;
    }

    setValidationResult(result.data);
    setOutput(buildOutput(result.data));
    toast({
      message: result.data.valid ? 'CPF valido.' : 'CPF invalido.',
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
      title="Validador de CPF"
      description="Valide formato e dígitos verificadores de um CPF"
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
              Informe um CPF com ou sem máscara.
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
          label="CPF"
          onChange={handleChange}
          placeholder="Ex.: 123.456.789-09 ou 12345678909"
          rows={6}
          value={input}
        />
        <ToolOutput copyable={false} label="Resultado da validação" rows={6} value={output} />
      </div>
    </ToolPage>
  );
}
