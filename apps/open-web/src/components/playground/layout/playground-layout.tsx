import type { ReactNode } from 'react';
import { PlaygrorErrorBoundary } from './playground-error-boundary';

interface PlaygroundLayoutProps {
  children: ReactNode;
}

export const PlaygroundLayout = ({ children }: PlaygroundLayoutProps) => {
  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <PlaygrorErrorBoundary>{children}</PlaygrorErrorBoundary>
    </div>
  );
};
