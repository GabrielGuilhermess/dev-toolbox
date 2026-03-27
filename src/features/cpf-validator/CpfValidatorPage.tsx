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
      toast({
        message: result.error,
        type: 'error',
      });
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
    toast({
      message: 'Campos limpos.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="Validador de CPF"
      description="Valide se um CPF e matematicamente correto"
      category="documents"
    >
      <ToolInput
        label="CPF"
        onChange={handleChange}
        placeholder="Ex.: 123.456.789-09 ou 12345678909"
        rows={4}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-11">
            {validationResult !== null ? (
              <Badge variant={validationResult.valid ? 'success' : 'error'}>
                {validationResult.valid ? 'Válido' : 'Inválido'}
              </Badge>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                Informe um CPF com ou sem máscara para verificar os dígitos.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button onClick={handleValidate} size="lg" variant="primary">
              Validar
            </Button>
            <CopyButton text={output} />
            <ClearButton disabled={input.length === 0 && output.length === 0} onClick={handleClear} />
          </div>
        </div>
      </Card>

      <ToolOutput copyable={false} label="Resultado da validação" rows={5} value={output} />
    </ToolPage>
  );
}
