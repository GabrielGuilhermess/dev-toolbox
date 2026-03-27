// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle';

describe('useDocumentTitle', () => {
  beforeEach(() => {
    document.title = 'Titulo anterior';
  });

  afterEach(() => {
    document.title = '';
  });

  it('define o titulo com o nome da aplicacao', () => {
    renderHook(() => {
      useDocumentTitle('Teste');
    });

    expect(document.title).toBe('Teste | Dev Toolbox');
  });

  it('restaura o titulo anterior ao desmontar', () => {
    const { unmount } = renderHook(() => {
      useDocumentTitle('Teste');
    });

    unmount();

    expect(document.title).toBe('Titulo anterior');
  });
});
