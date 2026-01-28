import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaygroundMainProps {
  children: ReactNode;
  className?: string;
}

export const PlaygroundMain = ({ children, className }: PlaygroundMainProps) => {
  return <main className={cn('flex flex-1 flex-col p-4', className)}>{children}</main>;
};
