import { X } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from '@/shared/components/ui';

export interface ClearButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ClearButton({ onClick, disabled = false }: ClearButtonProps): ReactElement {
  return (
    <Button disabled={disabled} onClick={onClick} type="button" variant="ghost">
      <X className="h-4 w-4" />
      Limpar
    </Button>
  );
}
