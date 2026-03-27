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
import { validateDocument } from './cpf-cnpj-validator.logic';
import type { DocumentValidationResult } from './cpf-cnpj-validator.types';

function getDocumentLabel(type: DocumentValidationResult['type']): string {
  return type === 'cpf' ? 'CPF' : 'CNPJ';
}

function buildOutput(validationResult: DocumentValidationResult): string {
  const documentLabel = getDocumentLabel(validationResult.type);

  return [
    `Tipo detectado: ${documentLabel}`,
    `${documentLabel} formatado: ${validationResult.formatted}`,
    `Status: ${documentLabel} ${validationResult.valid ? 'valido' : 'invalido'}`,
  ].join('\n');
}

export default function CpfCnpjValidatorPage(): ReactElement {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validationResult, setValidationResult] = useState<DocumentValidationResult | null>(null);

  const handleChange = (value: string): void => {
    setInput(value);
    setOutput('');
    setValidationResult(null);
  };

  const handleValidate = (): void => {
    const result = validateDocument(input);

    if (!result.success) {
      setOutput('');
      setValidationResult(null);
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    const documentLabel = getDocumentLabel(result.data.type);

    setValidationResult(result.data);
    setOutput(buildOutput(result.data));
    toast({
      message: `${documentLabel} ${result.data.valid ? 'valido' : 'invalido'}.`,
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
      title="Validador CPF/CNPJ"
      description="Cole um CPF ou CNPJ e descubra automaticamente se é válido"
      category="documents"
    >
      <ToolInput
        label="CPF ou CNPJ"
        onChange={handleChange}
        placeholder="Ex.: 123.456.789-09, 11.222.333/0001-81 ou apenas os dígitos"
        rows={4}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-11 flex-wrap items-center gap-3">
            {validationResult !== null ? (
              <>
                <Badge variant="info">{getDocumentLabel(validationResult.type)}</Badge>
                <Badge variant={validationResult.valid ? 'success' : 'error'}>
                  {validationResult.valid ? 'Válido' : 'Inválido'}
                </Badge>
              </>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                Informe um CPF ou CNPJ com ou sem máscara para detectar o tipo automaticamente.
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
