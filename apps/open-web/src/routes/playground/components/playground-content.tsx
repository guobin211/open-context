import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaygroundContentProps {
  children: ReactNode;
  className?: string;
}

export const PlaygroundContent = ({ children, className }: PlaygroundContentProps) => {
  return <div className={cn('bg-background flex flex-1 flex-col overflow-y-auto', className)}>{children}</div>;
};
