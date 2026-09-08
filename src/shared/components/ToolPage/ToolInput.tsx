import { useId, type ChangeEvent, type ReactElement } from 'react';
import { Textarea } from '@/shared/components/ui';

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
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={textareaId}>
          {label}
        </label>
        <span className="font-mono text-xs text-[var(--color-text-subtle)]">
          {value.length} caracteres
        </span>
      </div>

      <Textarea
        className="min-h-[11rem]"
        id={textareaId}
        monospace={monospace}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </section>
  );
}
