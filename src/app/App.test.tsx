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

  it('mantem nome, heading e titulo consistentes em todas as ferramentas', async () => {
    window.history.pushState({}, '', '/');

    const { default: App } = await import('@/app/App');
    render(createElement(App));

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Ferramentas para desenvolvimento.' },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();

    const navigation = screen.getByRole('navigation', { name: 'Categorias de ferramentas' });

    for (const tool of toolRegistry) {
      fireEvent.click(within(navigation).getByRole('link', { name: tool.name }));

      await waitFor(() => {
        expect(window.location.pathname).toBe(tool.path);
      });
      expect(
        await screen.findByRole('heading', { level: 1, name: tool.name }, { timeout: 5000 }),
      ).toBeInTheDocument();
      await waitFor(() => {
        expect(document.title).toBe(`${tool.name} | Dev Toolbox`);
      });
    }
  }, 15000);

  it('permite recolher e expandir categorias da sidebar', async () => {
    const { default: App } = await import('@/app/App');
    render(createElement(App));

    const documentsButton = await screen.findByRole('button', { name: /documentos/i });
    expect(documentsButton).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(documentsButton);
    expect(documentsButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(documentsButton);
    expect(documentsButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('troca a sidebar expandida por um rail compacto real', async () => {
    const { default: App } = await import('@/app/App');
    render(createElement(App));

    const expandedSidebar = await screen.findByLabelText('Navegação de ferramentas');
    expect(expandedSidebar).toHaveAttribute('data-sidebar-state', 'expanded');
    expect(screen.getByRole('link', { name: 'Gerador de CPF' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Recolher menu lateral' }));

    const collapsedSidebar = screen.getByLabelText('Navegação de ferramentas');
    expect(collapsedSidebar).toHaveAttribute('data-sidebar-state', 'collapsed');
    expect(screen.queryByRole('link', { name: 'Gerador de CPF' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expandir menu lateral' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Expandir menu lateral' }));

    expect(screen.getByLabelText('Navegação de ferramentas')).toHaveAttribute(
      'data-sidebar-state',
      'expanded',
    );
    expect(screen.getByRole('link', { name: 'Gerador de CPF' })).toBeInTheDocument();
  });
});
