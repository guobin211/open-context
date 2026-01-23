import { X } from 'lucide-react';

interface ContextTagProps {
  label: string;
  onRemove?: () => void;
}

export function ContextTag({ label, onRemove }: ContextTagProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-sm text-white">
      <span>{label}</span>
      {onRemove && (
        <button onClick={onRemove} className="rounded-full p-0.5 transition-colors hover:bg-emerald-600">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
