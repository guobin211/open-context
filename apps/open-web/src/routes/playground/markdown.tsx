import {
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundLayout,
  PlaygroundMain,
  PlaygroundSidebar
} from '@/routes/playground/components';
import { PlaygroundNavigation } from '@/components/navigation';
import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Suspense } from 'react';

const MarkdownEditor = lazyRouteComponent(() =>
  import('@/components/markdown').then((m) => ({ default: m.MarkdownEditor }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="Markdown 编辑器" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <MarkdownEditor />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/markdown')({
  component: RouteComponent
});
