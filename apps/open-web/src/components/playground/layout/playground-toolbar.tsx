import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaygroundToolbarProps {
  children: ReactNode;
  className?: string;
}

export const PlaygroundToolbar = ({ children, className }: PlaygroundToolbarProps) => {
  return (
    <footer className={cn('border-border bg-card flex h-10 shrink-0 items-center border-t px-4', className)}>
      {children}
    </footer>
  );
};
