import type { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContentHeader, AIInputBar } from '@/components/content';

interface ContentAreaProps {
  children: ReactNode;
}

export function ContentArea({ children }: ContentAreaProps) {
  return (
    <main className="flex h-screen flex-1 flex-col overflow-hidden bg-white">
      <ContentHeader />
      <ScrollArea className="min-h-0 flex-1">
        <div className="h-full">{children}</div>
      </ScrollArea>
      <AIInputBar />
    </main>
  );
}
