import type { Result } from '@/shared/types';

const EMPTY_INPUT_ERROR = 'Informe um JSON.';
const POSITION_PATTERN = /position\s+(\d+)/iu;

function getErrorPosition(input: string, errorMessage: string): number | null {
  const positionMatch = POSITION_PATTERN.exec(errorMessage);
  const position = positionMatch?.[1];

  if (position !== undefined) {
    return Number(position);
  }

  if (errorMessage.includes('Unexpected end of JSON input')) {
    return input.length;
  }

  return null;
}

function getErrorDescription(errorMessage: string): string {
  if (errorMessage.includes('Expected double-quoted property name')) {
    return 'Esperava uma chave entre aspas duplas.';
  }

  if (errorMessage.includes("Expected property name or '}'")) {
    return 'Esperava uma chave valida entre aspas duplas.';
  }

  if (errorMessage.includes("Expected ':' after property name")) {
    return 'Esperava ":" apos o nome da propriedade.';
  }

  if (errorMessage.includes('Unexpected end of JSON input')) {
    return 'JSON incompleto.';
  }

  if (errorMessage.includes('Unexpected token')) {
    return 'Encontrado um token invalido.';
  }

  return 'JSON invalido.';
}

function getLineAndColumn(
  input: string,
  position: number,
): {
  line: number;
  column: number;
} {
  const safePosition = Math.max(0, Math.min(position, input.length));
  let line = 1;
  let column = 1;

  for (let index = 0; index < safePosition; index += 1) {
    if (input[index] === '\n') {
      line += 1;
      column = 1;
      continue;
    }

    column += 1;
  }

  return { line, column };
}

function buildParseError(input: string, error: unknown): Result<never> {
  if (!(error instanceof SyntaxError)) {
    return {
      success: false,
      error: 'JSON invalido. Verifique a sintaxe do conteudo informado.',
    };
  }

  const description = getErrorDescription(error.message);
  const position = getErrorPosition(input, error.message);

  if (position === null) {
    return {
      success: false,
      error: `${description} Verifique a sintaxe do JSON informado.`,
    };
  }

  const { line, column } = getLineAndColumn(input, position);

  return {
    success: false,
    error: `${description} Erro na posicao ${String(position)} (linha ${String(line)}, coluna ${String(column)}).`,
  };
}

function parseJsonInput(input: string): Result<unknown> {
  if (input.trim().length === 0) {
    return {
      success: false,
      error: EMPTY_INPUT_ERROR,
    };
  }

  try {
    const parsed: unknown = JSON.parse(input);

    return {
      success: true,
      data: parsed,
    };
  } catch (error: unknown) {
    return buildParseError(input, error);
  }
}

export function getJsonRootTypeLabel(parsed: unknown): string {
  if (parsed === null) {
    return 'null';
  }

  if (Array.isArray(parsed)) {
    return 'array';
  }

  return typeof parsed;
}

export function buildValidationOutput(parsed: unknown): string {
  return [
    'Status: JSON valido',
    `Tipo raiz: ${getJsonRootTypeLabel(parsed)}`,
    'Conteudo normalizado:',
    JSON.stringify(parsed, null, 2),
  ].join('\n');
}

export function formatJson(input: string, indent: number): Result<string> {
  const parsedResult = parseJsonInput(input);

  if (!parsedResult.success) {
    return parsedResult;
  }

  return {
    success: true,
    data: JSON.stringify(parsedResult.data, null, indent),
  };
}

export function validateJson(input: string): Result<{ valid: boolean; parsed: unknown }> {
  const parsedResult = parseJsonInput(input);

  if (!parsedResult.success) {
    return parsedResult;
  }

  return {
    success: true,
    data: {
      valid: true,
      parsed: parsedResult.data,
    },
  };
}

export function minifyJson(input: string): Result<string> {
  const parsedResult = parseJsonInput(input);

  if (!parsedResult.success) {
    return parsedResult;
  }

  return {
    success: true,
    data: JSON.stringify(parsedResult.data),
  };
}
