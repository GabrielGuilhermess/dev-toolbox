// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toolRegistry } from '@/shared/constants';

describe('App', () => {
  beforeEach(() => {
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

  it('navega por todas as ferramentas pela sidebar', async () => {
    window.history.pushState({}, '', '/');

    const { default: App } = await import('@/app/App');

    render(createElement(App));

    expect(
      await screen.findByRole('heading', {
        name: 'Ferramentas rápidas para o dia a dia de desenvolvimento',
      }, { timeout: 5000 }),
    ).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Categorias de ferramentas' });

    for (const tool of toolRegistry) {
      fireEvent.click(within(navigation).getByRole('link', { name: new RegExp(tool.name, 'iu') }));

      expect(await screen.findByRole('heading', { name: tool.name }, { timeout: 5000 })).toBeInTheDocument();
      await waitFor(() => {
        expect(document.title).toBe(`${tool.name} | Dev Toolbox`);
      });
    }
  }, 15000);
});
