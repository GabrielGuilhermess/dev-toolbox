import { useEffect } from 'react';

const APP_NAME = 'Dev Toolbox';

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const previousTitle = document.title;

    document.title = `${title} | ${APP_NAME}`;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
