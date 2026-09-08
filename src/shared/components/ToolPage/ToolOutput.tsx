import { useId, type ReactElement } from 'react';
import { Textarea } from '@/shared/components/ui';
import CopyButton from '@/shared/components/ToolPage/CopyButton';

export interface ToolOutputProps {
  label: string;
  value: string;
  monospace?: boolean;
  rows?: number;
  copyable?: boolean;
}

export default function ToolOutput({
  label,
  value,
  monospace = true,
  rows = 6,
  copyable = true,
}: ToolOutputProps): ReactElement {
  const textareaId = useId();

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium" htmlFor={textareaId}>
          {label}
        </label>

        {copyable && value.length > 0 ? <CopyButton size="sm" text={value} /> : null}
      </div>

      <Textarea
        className="min-h-[11rem]"
        id={textareaId}
        monospace={monospace}
        readOnly
        rows={rows}
        value={value}
      />
    </section>
  );
}
