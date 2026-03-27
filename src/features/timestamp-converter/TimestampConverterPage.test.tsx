// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/shared/components/ui';

interface ClipboardMock {
  writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;
}

async function renderTimestampConverterPage(): Promise<ReactElement> {
  const { default: TimestampConverterPage } = await import('./index');

  return createElement(TimestampConverterPage);
}

describe('TimestampConverterPage', () => {
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
    window.localStorage.clear();
    document.title = '';
  });

  it('carrega a pagina na rota /timestamp via lazy loading', async () => {
    window.history.pushState({}, '', '/timestamp');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', { name: 'Timestamp Converter' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Timestamp para Data' })).toBeInTheDocument();

    await waitFor(() => {
      expect(document.title).toBe('Timestamp Converter | Dev Toolbox');
    });
  }, 10000);

  it('converte timestamp, alterna para data e limpa os campos', async () => {
    render(createElement(ToastProvider, undefined, await renderTimestampConverterPage()));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Timestamp Unix'), {
      target: { value: '1700000000' },
    });

    expect(screen.getByLabelText<HTMLTextAreaElement>('Data convertida').value).toContain(
      'ISO: 2023-11-14T22:13:20.000Z',
    );
    expect(screen.getByText('segundos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Data para Timestamp' }));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Data ou horario'), {
      target: { value: '2024-01-01' },
    });

    expect(screen.getByLabelText<HTMLTextAreaElement>('Timestamps gerados')).toHaveValue(
      'Segundos: 1704067200\nMilissegundos: 1704067200000',
    );

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLTextAreaElement>('Data ou horario')).toHaveValue('');
      expect(screen.getByLabelText<HTMLTextAreaElement>('Timestamps gerados')).toHaveValue('');
      expect(screen.getByText('Campos limpos.')).toBeInTheDocument();
    });
  });

  it('detecta milissegundos automaticamente e atualiza a secao agora a cada segundo', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    render(createElement(ToastProvider, undefined, await renderTimestampConverterPage()));

    fireEvent.change(screen.getByLabelText<HTMLTextAreaElement>('Timestamp Unix'), {
      target: { value: '1700000000000' },
    });

    expect(screen.getByText('milissegundos')).toBeInTheDocument();
    expect(screen.getByLabelText<HTMLTextAreaElement>('Data convertida').value).toContain(
      'ISO: 2023-11-14T22:13:20.000Z',
    );

    expect(screen.getByText('1704067200')).toBeInTheDocument();
    expect(screen.getByText('1704067200000')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText('1704067201')).toBeInTheDocument();
    expect(screen.getByText('1704067201000')).toBeInTheDocument();
  });
});
