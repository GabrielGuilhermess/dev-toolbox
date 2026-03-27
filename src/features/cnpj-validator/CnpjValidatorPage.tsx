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
      toast({
        message: result.error,
        type: 'error',
      });
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
    toast({
      message: 'Campos limpos.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="Validador de CNPJ"
      description="Valide se um CNPJ e matematicamente correto"
      category="documents"
    >
      <ToolInput
        label="CNPJ"
        onChange={handleChange}
        placeholder="Ex.: 11.222.333/0001-81 ou 11222333000181"
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
                Informe um CNPJ com ou sem máscara para verificar os dígitos.
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

      <ToolOutput copyable={false} label="Resultado da validação" rows={4} value={output} />
    </ToolPage>
  );
}
