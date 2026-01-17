import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { ContentArea } from './content-area';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <ContentArea>{children}</ContentArea>
    </div>
  );
}
