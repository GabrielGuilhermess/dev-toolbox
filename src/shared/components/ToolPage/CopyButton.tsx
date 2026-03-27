import { Check, Copy } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '@/shared/components/ui';
import { useClipboard } from '@/shared/hooks';

export interface CopyButtonProps {
  text: string;
  size?: 'sm' | 'md';
}

export default function CopyButton({ text, size = 'md' }: CopyButtonProps): ReactElement {
  const { copy, copied } = useClipboard();

  const handleCopy = async (): Promise<void> => {
    if (text.length === 0) {
      return;
    }

    try {
      await copy(text);
    } catch {
      return;
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <Button
      aria-label={copied ? 'Texto copiado' : 'Copiar texto'}
      disabled={text.length === 0}
      onClick={() => {
        void handleCopy();
      }}
      size={size}
      variant={copied ? 'outline' : 'ghost'}
    >
      <Icon className="h-4 w-4" />
      {copied ? 'Copiado' : 'Copiar'}
    </Button>
  );
}
