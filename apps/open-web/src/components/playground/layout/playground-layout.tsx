import type { ReactNode } from 'react';

interface PlaygroundLayoutProps {
  children: ReactNode;
}

export const PlaygroundLayout = ({ children }: PlaygroundLayoutProps) => {
  return <div className="bg-background flex h-screen overflow-hidden">{children}</div>;
};
