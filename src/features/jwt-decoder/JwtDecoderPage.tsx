import { useState, type ReactElement } from 'react';
import {
  Badge,
  Button,
  Card,
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

  const temporalBadge =
    temporalStatus === null ? INITIAL_TEMPORAL_STATUS : TEMPORAL_STATUS_OPTIONS[temporalStatus];
  const signatureBadge =
    signatureValidation === null
      ? INITIAL_SIGNATURE_STATUS
      : SIGNATURE_STATUS_OPTIONS[signatureValidation.status];
  const payloadHighlights = decodedToken === null ? [] : PAYLOAD_HIGHLIGHT_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(decodedToken.payload, key));
  const algorithmLabel = decodedToken === null ? 'Nao informado' : extractJwtAlgorithm(decodedToken.header).algorithm ?? 'Nao informado';
  const clearDisabled = input.length === 0 && secret.length === 0 && errorMessage.length === 0 && decodedToken === null;

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
    toast({ message: result.data.message, type: result.data.status === 'valid' ? 'success' : result.data.status === 'invalid' ? 'error' : 'info' });
  };

  return (
    <ToolPage
      title="JWT Decoder"
      description="Decodifique JWTs, inspecione header/payload/signature e valide assinatura HMAC no navegador."
      category="data"
    >
      <ToolInput
        label="Token JWT"
        onChange={(value) => {
          setInput(value);
          resetDecodedState();
        }}
        placeholder="Cole o token JWT aqui..."
        rows={10}
        value={input}
      />

      <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={temporalBadge.variant}>{temporalBadge.label}</Badge>
            <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              {temporalBadge.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button onClick={handleDecode} size="lg" variant="primary">
              Decodificar
            </Button>
            <ClearButton disabled={clearDisabled} onClick={() => {
              setInput('');
              setSecret('');
              resetDecodedState();
              toast({ message: 'Campos limpos.', type: 'info' });
            }} />
          </div>
        </div>
      </Card>

      {errorMessage.length > 0 ? <ToolOutput copyable={false} label="Erro" rows={4} value={errorMessage} /> : null}

      {decodedToken !== null ? (
        <>
          <ToolOutput label="Header" rows={10} value={JSON.stringify(decodedToken.header, null, 2)} />
          <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={signatureBadge.variant}>{signatureBadge.label}</Badge>
                <p className="max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                  {signatureValidation?.message ?? signatureBadge.description}
                </p>
              </div>
              <div className="flex flex-col gap-4">
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
                <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                  Algoritmo do header: <span className="font-semibold text-[var(--color-text)]">{algorithmLabel}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Button disabled={secret.length === 0} loading={isValidating} onClick={() => { void handleValidateSignature(); }} size="lg" variant="secondary">
                  Validar assinatura
                </Button>
              </div>
            </div>
          </Card>
          <Card className="rounded-3xl p-5 shadow-lg shadow-black/5">
            {payloadHighlights.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">
                Nenhum destaque encontrado entre os campos exp, iat, sub ou iss.
              </p>
            )}
          </Card>
          <ToolOutput label="Payload" rows={12} value={JSON.stringify(decodedToken.payload, null, 2)} />
          <ToolOutput label="Signature" rows={6} value={decodedToken.signature} />
        </>
      ) : null}
    </ToolPage>
  );
}
