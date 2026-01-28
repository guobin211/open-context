import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Suspense } from 'react';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

const ChatInterface = lazyRouteComponent(() =>
  import('@/components/playground/chat').then((m) => ({ default: m.ChatInterface }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="聊天界面" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <ChatInterface />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/chat')({
  component: RouteComponent
});
