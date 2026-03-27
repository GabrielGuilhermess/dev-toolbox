import { describe, expect, it } from 'vitest';
import { formatJson, minifyJson, validateJson } from './json-formatter.logic';

describe('json-formatter.logic', () => {
  it('formata um JSON simples com indentacao 2', () => {
    expect(formatJson('{"a":1}', 2)).toEqual({
      success: true,
      data: '{\n  "a": 1\n}',
    });
  });

  it('retorna erro com posicao para JSON invalido', () => {
    expect(formatJson('{"a":1,}', 2)).toEqual({
      success: false,
      error: 'Esperava uma chave entre aspas duplas. Erro na posicao 7 (linha 1, coluna 8).',
    });
  });

  it.each(['', '   ', '\n\t  '])('retorna erro quando o input esta vazio: %j', (input) => {
    expect(validateJson(input)).toEqual({
      success: false,
      error: 'Informe um JSON.',
    });
  });

  it('retorna a posicao final quando o JSON termina de forma inesperada', () => {
    expect(validateJson('{"a":')).toEqual({
      success: false,
      error: 'JSON incompleto. Erro na posicao 5 (linha 1, coluna 6).',
    });
  });

  it('retorna uma mensagem legivel quando o erro nao informa posicao', () => {
    expect(minifyJson('[1,2,]')).toEqual({
      success: false,
      error: 'Encontrado um token invalido. Verifique a sintaxe do JSON informado.',
    });
  });

  it('minifica um JSON preservando os dados', () => {
    const input = '{\n  "name": "Ana",\n  "active": true,\n  "items": [1, null, false]\n}';
    const result = minifyJson(input);

    expect(result).toEqual({
      success: true,
      data: '{"name":"Ana","active":true,"items":[1,null,false]}',
    });

    if (!result.success) {
      return;
    }

    expect(JSON.parse(result.data)).toEqual(JSON.parse(input));
  });

  it('formata objetos aninhados corretamente', () => {
    expect(formatJson('{"a":{"b":[1,{"c":true}]}}', 4)).toEqual({
      success: true,
      data: [
        '{',
        '    "a": {',
        '        "b": [',
        '            1,',
        '            {',
        '                "c": true',
        '            }',
        '        ]',
        '    }',
        '}',
      ].join('\n'),
    });
  });

  it('valida arrays, nulls e booleans', () => {
    expect(validateJson('[true,false,null]')).toEqual({
      success: true,
      data: {
        valid: true,
        parsed: [true, false, null],
      },
    });
  });

  it('processa um JSON grande com cerca de 10KB', () => {
    const largePayload = 'a'.repeat(10_240);
    const input = JSON.stringify({
      payload: largePayload,
      enabled: true,
      tags: ['json', 'formatter'],
    });
    const result = formatJson(input, 2);

    expect(result.success).toBe(true);

    if (!result.success) {
      return;
    }

    expect(JSON.parse(result.data)).toEqual({
      payload: largePayload,
      enabled: true,
      tags: ['json', 'formatter'],
    });
  });
});
