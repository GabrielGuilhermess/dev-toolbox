import { useState, type ReactElement } from 'react';
import {
  Button,
  ClearButton,
  Input,
  ToolInput,
  ToolOutput,
  ToolPage,
} from '@/shared/components';
import { useDocumentTitle, useToast } from '@/shared/hooks';
import {
  decodeJwt,
  extractJwtAlgorithm,
  formatPayloadHighlightValue,
  getJwtStatus,
  validateJwtSignature,
} from './jwt-decoder.logic';
import {
  INITIAL_SIGNATURE_STATUS,
  INITIAL_TEMPORAL_STATUS,
  PAYLOAD_HIGHLIGHT_KEYS,
  PAYLOAD_HIGHLIGHT_LABELS,
  SIGNATURE_STATUS_OPTIONS,
  TEMPORAL_STATUS_OPTIONS,
  type JwtParts,
  type JwtSignatureValidation,
  type JwtTemporalStatus,
} from './jwt-decoder.types';

export default function JwtDecoderPage(): ReactElement {
  useDocumentTitle('JWT Decoder');
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [secret, setSecret] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [decodedToken, setDecodedToken] = useState<JwtParts | null>(null);
  const [temporalStatus, setTemporalStatus] = useState<JwtTemporalStatus | null>(null);
  const [signatureValidation, setSignatureValidation] = useState<JwtSignatureValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const temporalState =
    temporalStatus === null ? INITIAL_TEMPORAL_STATUS : TEMPORAL_STATUS_OPTIONS[temporalStatus];
  const signatureState =
    signatureValidation === null
      ? INITIAL_SIGNATURE_STATUS
      : SIGNATURE_STATUS_OPTIONS[signatureValidation.status];
  const payloadHighlights =
    decodedToken === null
      ? []
      : PAYLOAD_HIGHLIGHT_KEYS.filter((key) =>
          Object.prototype.hasOwnProperty.call(decodedToken.payload, key),
        );
  const algorithmLabel =
    decodedToken === null
      ? 'Não informado'
      : (extractJwtAlgorithm(decodedToken.header).algorithm ?? 'Não informado');
  const clearDisabled =
    input.length === 0 && secret.length === 0 && errorMessage.length === 0 && decodedToken === null;

  const resetDecodedState = (): void => {
    setErrorMessage('');
    setDecodedToken(null);
    setTemporalStatus(null);
    setSignatureValidation(null);
    setIsValidating(false);
  };

  const handleDecode = (): void => {
    const result = decodeJwt(input);
    if (!result.success) {
      resetDecodedState();
      setErrorMessage(`Erro: ${result.error}`);
      toast({ message: result.error, type: 'error' });
      return;
    }

    setDecodedToken(result.data);
    setTemporalStatus(getJwtStatus(result.data.payload));
    setSignatureValidation(null);
    setErrorMessage('');
    toast({ message: 'Token JWT decodificado com sucesso.', type: 'success' });
  };

  const handleValidateSignature = async (): Promise<void> => {
    if (decodedToken === null) return;

    setIsValidating(true);
    const result = await validateJwtSignature(input, secret);
    setIsValidating(false);

    if (!result.success) {
      setSignatureValidation(null);
      toast({ message: result.error, type: 'error' });
      return;
    }

    setSignatureValidation(result.data);
    toast({
      message: result.data.message,
      type:
        result.data.status === 'valid'
          ? 'success'
          : result.data.status === 'invalid'
            ? 'error'
            : 'info',
    });
  };

  const handleClear = (): void => {
    setInput('');
    setSecret('');
    resetDecodedState();
    toast({ message: 'Campos limpos.', type: 'info' });
  };

  return (
    <ToolPage
      title="JWT Decoder"
      description="Decodifique JWTs, inspecione header, payload e signature e valide HMAC localmente."
      category="data"
    >
      <section className="space-y-4 border-b border-[var(--divider-item)] pb-5">
        <ToolInput
          label="Token JWT"
          onChange={(value) => {
            setInput(value);
            resetDecodedState();
          }}
          placeholder="Cole o token JWT aqui..."
          rows={8}
          value={input}
        />

        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">
                Estado temporal
              </span>
              <strong className="font-mono text-sm font-medium text-[var(--color-primary)]">
                {temporalState.label}
              </strong>
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              {temporalState.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ClearButton disabled={clearDisabled} onClick={handleClear} />
            <Button onClick={handleDecode} variant="primary">
              Decodificar
            </Button>
          </div>
        </div>
      </section>

      {errorMessage.length > 0 ? (
        <ToolOutput copyable={false} label="Erro" rows={4} value={errorMessage} />
      ) : null}

      {decodedToken !== null ? (
        <div className="space-y-6">
          <section aria-labelledby="jwt-structure-heading" className="space-y-4">
            <div className="border-b border-[var(--divider-item)] pb-3">
              <h2 className="text-sm font-medium" id="jwt-structure-heading">
                Estrutura do token
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                Conteúdo decodificado localmente. Nenhuma assinatura é validada nesta etapa.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ToolOutput label="Header" rows={10} value={JSON.stringify(decodedToken.header, null, 2)} />
              <ToolOutput label="Payload" rows={12} value={JSON.stringify(decodedToken.payload, null, 2)} />
            </div>
          </section>

          <section aria-labelledby="jwt-claims-heading" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--divider-item)] pb-3">
              <h2 className="text-sm font-medium" id="jwt-claims-heading">
                Claims e metadados
              </h2>
              <span className="font-mono text-xs text-[var(--color-text-subtle)]">
                {payloadHighlights.length} {payloadHighlights.length === 1 ? 'claim' : 'claims'} em destaque
              </span>
            </div>

            {payloadHighlights.length > 0 ? (
              <dl className="divide-y divide-[var(--divider-item)] border-y border-[var(--divider-item)]">
                {payloadHighlights.map((key) => (
                  <div className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4" key={key}>
                    <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-subtle)]">
                      {PAYLOAD_HIGHLIGHT_LABELS[key]}
                    </dt>
                    <dd className="break-words font-mono text-sm leading-6 text-[var(--color-text)]">
                      {formatPayloadHighlightValue(key, decodedToken.payload[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                Nenhum destaque encontrado entre os campos exp, iat, sub ou iss.
              </p>
            )}
          </section>

          <section aria-labelledby="jwt-signature-heading" className="space-y-4 border-t border-[var(--divider-item)] pt-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-sm font-medium" id="jwt-signature-heading">
                    Validação HMAC
                  </h2>
                  <strong className="font-mono text-sm font-medium text-[var(--color-primary)]">
                    {isValidating ? 'Validando…' : signatureState.label}
                  </strong>
                </div>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  {signatureValidation?.message ?? signatureState.description}
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2 text-xs text-[var(--color-text-subtle)]">
                  <span>Algoritmo do header:</span>
                  <span className="font-mono">{algorithmLabel}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Input
                  autoComplete="off"
                  label="Segredo HMAC"
                  onChange={(event) => {
                    setSecret(event.target.value);
                    setSignatureValidation(null);
                  }}
                  placeholder="Informe o segredo usado para assinar"
                  type="password"
                  value={secret}
                />
                <div className="flex justify-end">
                  <Button
                    disabled={secret.length === 0}
                    loading={isValidating}
                    onClick={() => {
                      void handleValidateSignature();
                    }}
                    variant="secondary"
                  >
                    Validar assinatura
                  </Button>
                </div>
              </div>
            </div>

            <ToolOutput label="Signature" rows={6} value={decodedToken.signature} />
          </section>
        </div>
      ) : null}
    </ToolPage>
  );
}
