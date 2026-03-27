import type { ReactElement, ReactNode } from 'react';
import { ThemeProvider } from '@/shared/providers';
import { ToastProvider } from '@/shared/components/ui';

export interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({
  children,
}: ProvidersProps): ReactElement {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
