import {
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundLayout,
  PlaygroundMain,
  PlaygroundSidebar
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';
import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Suspense } from 'react';

const MonacoEditor = lazyRouteComponent(() =>
  import('@/components/playground/code-editor').then((m) => ({ default: m.MonacoEditor }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="代码编辑器" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <MonacoEditor />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/code-editor')({
  component: RouteComponent
});
