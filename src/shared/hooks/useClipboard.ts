import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/shared/hooks/useToast';

const COPIED_RESET_DELAY_MS = 2000;

export interface UseClipboardResult {
  copy: (text: string) => Promise<void>;
  copied: boolean;
}

export function useClipboard(): UseClipboardResult {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current !== null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const copy = async (text: string): Promise<void> => {
    await navigator.clipboard.writeText(text);

    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    setCopied(true);

    resetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimeoutRef.current = null;
    }, COPIED_RESET_DELAY_MS);

    toast({ message: 'Copiado!', type: 'success' });
  };

  return { copy, copied };
}
