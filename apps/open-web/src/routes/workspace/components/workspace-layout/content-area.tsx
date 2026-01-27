import type { ReactNode } from 'react';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { AIInputBar } from './ai-input-bar';
import { EditorTabs } from './editor-tabs';

interface ContentAreaProps {
  children: ReactNode;
}

export const ContentArea = ({ children }: ContentAreaProps) => {
  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <EditorTabs />
      <ScrollArea className="min-h-0 flex-1">
        <div className="h-full">{children}</div>
      </ScrollArea>
      <AIInputBar />
    </main>
  );
};
