import { useId, type ChangeEvent, type ReactElement } from 'react';
import { Card, Textarea } from '@/shared/components/ui';

export interface ToolInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  monospace?: boolean;
  rows?: number;
}

export default function ToolInput({
  label,
  value,
  onChange,
  placeholder,
  monospace = true,
  rows = 6,
}: ToolInputProps): ReactElement {
  const textareaId = useId();

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange(event.target.value);
  };

  return (
    <Card className="p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-sm font-semibold" htmlFor={textareaId}>
          {label}
        </label>
      </div>

      <div className="relative">
        <Textarea
          className="min-h-[11rem] pb-10"
          id={textareaId}
          monospace={monospace}
          onChange={handleChange}
          placeholder={placeholder}
          rows={rows}
          value={value}
        />

        <span className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[var(--color-surface-elevated)] px-2 py-1 text-xs font-medium text-[var(--color-text-subtle)] shadow-sm">
          {value.length} caracteres
        </span>
      </div>
    </Card>
  );
}
