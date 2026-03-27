// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';
import * as cpfGeneratorLogic from './cpf-generator.logic';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

function calculateExpectedCheckDigit(digits: string): string {
  const weights = Array.from({ length: digits.length }, (_, index) => digits.length + 1 - index);
  const sum = Array.from(digits).reduce(
    (total, digit, index) => total + Number(digit) * (weights[index] ?? 0),
    0,
  );
  const remainder = sum % 11;

  return String(remainder < 2 ? 0 : 11 - remainder);
}

function isValidCpf(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (!/^\d{11}$/u.test(digits) || /^(\d)\1{10}$/u.test(digits)) {
    return false;
  }

  const firstCheckDigit = calculateExpectedCheckDigit(digits.slice(0, 9));
  const secondCheckDigit = calculateExpectedCheckDigit(digits.slice(0, 10));

  return digits === `${digits.slice(0, 9)}${firstCheckDigit}${secondCheckDigit}`;
}

async function renderGeneratorPage(): Promise<ReactElement> {
  const { default: CpfGeneratorPage } = await import('./index');

  return createElement(CpfGeneratorPage);
}

describe('CpfGeneratorPage', () => {
  let clipboardMock: ClipboardMock;

  beforeEach(() => {
    clipboardMock = {
      writeText: vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined),
    };

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: clipboardMock,
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    document.title = '';
  });

  it('carrega a pagina na rota /cpf-generator via lazy loading', async () => {
    window.history.pushState({}, '', '/cpf-generator');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'Gerador de CPF' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Gerador de CPF | Dev Toolbox');
    });
  }, 10000);

  it('gera 10 CPFs, copia o resultado, limpa a saida e exibe feedback', async () => {
    render(createElement(ToastProvider, undefined, await renderGeneratorPage()));

    fireEvent.change(screen.getByLabelText('Quantidade'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByLabelText('Gerar com mascara'));
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }));

    const output = screen.getByLabelText<HTMLTextAreaElement>('CPFs gerados');

    await waitFor(() => {
      expect(output.value.length).toBeGreaterThan(0);
      expect(screen.getByText('CPFs gerados com sucesso.')).toBeInTheDocument();
    });

    const generatedValues = output.value.split('\n').filter((value) => value.length > 0);

    expect(generatedValues).toHaveLength(10);
    expect(generatedValues.every((value) => /^\d{11}$/u.test(value) && isValidCpf(value))).toBe(true);
    expect(screen.getByLabelText('Parâmetros da geração')).toHaveValue(
      'Quantidade: 10\nFormato: Somente numeros',
    );

    fireEvent.click(screen.getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(output.value);
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('');
      expect(screen.getByText('Resultado limpo.')).toBeInTheDocument();
    });
  });

  it('exibe toast de erro quando a geracao falha', async () => {
    vi.spyOn(cpfGeneratorLogic, 'generateCpf').mockReturnValue({
      success: false,
      error: 'A quantidade deve ser maior que zero.',
    });

    render(createElement(ToastProvider, undefined, await renderGeneratorPage()));

    fireEvent.click(screen.getByRole('button', { name: /gerar/i }));

    expect(await screen.findByText('A quantidade deve ser maior que zero.')).toBeInTheDocument();
  });
});
