import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '@/shared/components/ui/Toast';

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
