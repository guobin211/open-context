import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaygroundSidebarProps {
  children: ReactNode;
  className?: string;
}

export const PlaygroundSidebar = ({ children, className }: PlaygroundSidebarProps) => {
  return (
    <aside className={cn('border-border bg-card flex w-60 shrink-0 flex-col overflow-y-auto border-r', className)}>
      {children}
    </aside>
  );
};
