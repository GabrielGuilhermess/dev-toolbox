// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastContext, type ToastPayload } from '@/shared/components/ui';
import { useClipboard } from '@/shared/hooks/useClipboard';

interface ToastProviderWrapperProps {
  children: ReactNode;
}

describe('useClipboard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('copia o texto, exibe feedback e reseta o estado apos 2 segundos', async () => {
    const writeTextMock = vi.fn((text: string): Promise<void> => {
      void text;
      return Promise.resolve();
    });
    const toastMock = vi.fn((payload: ToastPayload): void => {
      void payload;
    });

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      } satisfies Pick<Clipboard, 'writeText'>,
    });

    const wrapper = ({ children }: ToastProviderWrapperProps): ReactNode => (
      <ToastContext.Provider value={{ toast: toastMock }}>{children}</ToastContext.Provider>
    );

    const { result } = renderHook(() => useClipboard(), { wrapper });

    await act(async () => {
      await result.current.copy('teste');
    });

    expect(writeTextMock).toHaveBeenCalledWith('teste');
    expect(toastMock).toHaveBeenCalledWith({
      message: 'Copiado!',
      type: 'success',
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1999);
    });

    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.copied).toBe(false);
  });

  it('limpa o timer pendente ao desmontar', async () => {
    const writeTextMock = vi.fn((text: string): Promise<void> => {
      void text;
      return Promise.resolve();
    });
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: writeTextMock,
      } satisfies Pick<Clipboard, 'writeText'>,
    });

    const { result, unmount } = renderHook(() => useClipboard());

    await act(async () => {
      await result.current.copy('teste');
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
