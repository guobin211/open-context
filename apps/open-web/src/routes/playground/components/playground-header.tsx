import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaygroundHeaderProps {
  title: string;
  actions?: ReactNode;
  className?: string;
}

export const PlaygroundHeader = ({ title, actions, className }: PlaygroundHeaderProps) => {
  return (
    <header
      className={cn('border-border bg-card flex h-12 shrink-0 items-center justify-between border-b px-4', className)}
    >
      <h1 className="text-lg font-semibold">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
};
