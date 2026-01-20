import type { ReactNode } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { ContentHeader } from './content-header';
import { AIInputBar } from './ai-input-bar';

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
