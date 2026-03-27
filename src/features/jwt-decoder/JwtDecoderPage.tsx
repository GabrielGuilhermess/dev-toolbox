import { useId, useState, type ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
  ClearButton,
  CopyButton,
  Textarea,
  ToolInput,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useToast } from '@/shared/hooks';
import {
  decodeJwt,
  formatPayloadHighlightValue,
  getJwtStatus,
  renderStatusBadge,
} from './jwt-decoder.logic';
import {
  PAYLOAD_HIGHLIGHT_KEYS,
  PAYLOAD_HIGHLIGHT_LABELS,
  type JwtParts,
  type JwtStatus,
} from './jwt-decoder.types';

function formatJwtSection(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

function hasPayloadField(
  payload: Record<string, unknown>,
  key: (typeof PAYLOAD_HIGHLIGHT_KEYS)[number],
): boolean {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

export default function JwtDecoderPage(): ReactElement {
  const payloadTextareaId = useId();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [decodedToken, setDecodedToken] = useState<JwtParts | null>(null);
  const [status, setStatus] = useState<JwtStatus | null>(null);

  const formattedHeader = decodedToken === null ? '' : formatJwtSection(decodedToken.header);
  const formattedPayload = decodedToken === null ? '' : formatJwtSection(decodedToken.payload);
  const signature = decodedToken?.signature ?? '';
  const currentStatus = renderStatusBadge(status);
  const payloadHighlights =
    decodedToken === null
      ? []
      : PAYLOAD_HIGHLIGHT_KEYS.filter((key) => hasPayloadField(decodedToken.payload, key));

  const handleChange = (value: string): void => {
    setInput(value);
    setErrorMessage('');
    setDecodedToken(null);
    setStatus(null);
  };

  const handleDecode = (): void => {
    const result = decodeJwt(input);

    if (!result.success) {
      setDecodedToken(null);
      setStatus(null);
      setErrorMessage(`Erro: ${result.error}`);
      toast({
        message: result.error,
        type: 'error',
      });
      return;
    }

    const nextStatus = getJwtStatus(result.data.payload);

    setDecodedToken(result.data);
    setStatus(nextStatus);
    setErrorMessage('');
    toast({
      message: 'Token JWT decodificado com sucesso.',
      type: 'success',
    });
  };

  const handleClear = (): void => {
    setInput('');
    setErrorMessage('');
    setDecodedToken(null);
    setStatus(null);
    toast({
      message: 'Campos limpos.',
      type: 'info',
    });
  };

  return (
    <ToolPage
      title="JWT Decoder"
      description="Decodifique e inspecione tokens JWT (sem validar assinatura)"
      category="data"
    >
      <ToolInput
        label="Token JWT"
        onChange={handleChange}
        placeholder="Cole o token JWT aqui..."
        rows={10}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
              <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                {currentStatus.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button onClick={handleDecode} size="lg" variant="primary">
                Decodificar
              </Button>
              <ClearButton
                disabled={input.length === 0 && errorMessage.length === 0 && decodedToken === null}
                onClick={handleClear}
              />
            </div>
          </div>
        </div>
      </Card>

      {errorMessage.length > 0 ? (
        <ToolOutput copyable={false} label="Erro" rows={4} value={errorMessage} />
      ) : null}

      {decodedToken !== null ? (
        <>
          <ToolOutput label="Header" rows={10} value={formattedHeader} />

          <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold" htmlFor={payloadTextareaId}>
                  Payload
                </label>
                {status !== null ? (
                  <Badge variant={currentStatus.variant}>{currentStatus.label}</Badge>
                ) : null}
              </div>

              <CopyButton size="sm" text={formattedPayload} />
            </div>

            {payloadHighlights.length > 0 ? (
              <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {payloadHighlights.map((key) => (
                  <div
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-output-bg)] p-3"
                    key={key}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                      {PAYLOAD_HIGHLIGHT_LABELS[key]}
                    </p>
                    <p className="mt-2 break-words text-sm leading-6 text-[var(--color-text)]">
                      {formatPayloadHighlightValue(key, decodedToken.payload[key])}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-4 text-sm leading-6 text-[var(--color-text-muted)]">
                Nenhum destaque encontrado entre os campos exp, iat, sub ou iss.
              </p>
            )}

            <Textarea
              className="min-h-[11rem] bg-[var(--color-output-bg)]"
              id={payloadTextareaId}
              monospace
              readOnly
              rows={12}
              value={formattedPayload}
            />
          </Card>

          <ToolOutput label="Signature" rows={6} value={signature} />
        </>
      ) : null}
    </ToolPage>
  );
}
