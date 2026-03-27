// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MOCK_UUID_PREFIX = '123e4567-e89b-42d3-a456-';

type UuidString = ReturnType<Crypto['randomUUID']>;

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

function createMockUuid(index: number): UuidString {
  return `${MOCK_UUID_PREFIX}${index.toString(16).padStart(12, '0')}` as UuidString;
}

async function renderUuidGeneratorPage(): Promise<ReactElement> {
  const { default: UuidGeneratorPage } = await import('./index');

  return createElement(UuidGeneratorPage);
}

describe('UuidGeneratorPage', () => {
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

  it('carrega a pagina na rota /uuid-generator via lazy loading', async () => {
    window.history.pushState({}, '', '/uuid-generator');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'UUID Generator' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gerar/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('UUID Generator | Dev Toolbox');
    });
  }, 10000);

  it('gera 1 UUID valido, gera 10 valores unicos, copia os resultados e aplica uppercase', async () => {
    const mockSequence = Array.from({ length: 11 }, (_, index) => createMockUuid(index + 1));

    vi.spyOn(globalThis.crypto, 'randomUUID').mockImplementation((): UuidString => {
      const nextUuid = mockSequence.shift();

      if (nextUuid === undefined) {
        throw new Error('Sequencia de UUIDs mockada esgotada.');
      }

      return nextUuid;
    });

    render(createElement(ToastProvider, undefined, await renderUuidGeneratorPage()));

    const output = screen.getByLabelText<HTMLTextAreaElement>('UUIDs gerados');

    fireEvent.click(screen.getByRole('button', { name: /gerar/i }));

    await waitFor(() => {
      expect(output).toHaveValue(createMockUuid(1));
      expect(output.value).toMatch(UUID_REGEX);
      expect(screen.getByText('1 UUID gerado com sucesso.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText<HTMLSelectElement>('Quantidade'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /gerar em mai/i }));
    fireEvent.click(screen.getByRole('button', { name: /gerar/i }));

    await waitFor(() => {
      const generatedUuids = output.value.split('\n');

      expect(generatedUuids).toHaveLength(10);
      expect(new Set(generatedUuids).size).toBe(10);
      generatedUuids.forEach((uuid) => {
        expect(uuid).toMatch(UUID_REGEX);
        expect(uuid).toBe(uuid.toUpperCase());
      });
      expect(screen.getAllByRole('listitem')).toHaveLength(10);
      expect(screen.getByText('10 UUIDs gerados com sucesso.')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /copiar texto/i })).toHaveLength(11);
    });

    const [copyAllButton] = screen.getAllByRole('button', { name: /copiar texto/i });

    if (copyAllButton === undefined) {
      throw new Error('Botao de copiar todos nao encontrado.');
    }

    fireEvent.click(copyAllButton);

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(output.value);
    });

    const [firstUuidItem] = screen.getAllByRole('listitem');

    if (firstUuidItem === undefined) {
      throw new Error('Primeiro UUID da lista nao encontrado.');
    }

    fireEvent.click(within(firstUuidItem).getByRole('button', { name: /copiar texto/i }));

    await waitFor(() => {
      expect(clipboardMock.writeText).toHaveBeenCalledWith(createMockUuid(2).toUpperCase());
    });

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(output).toHaveValue('');
      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
      expect(screen.getByText('UUIDs limpos.')).toBeInTheDocument();
    });
  });
});
