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

const DiffViewer = lazyRouteComponent(() =>
  import('@/components/playground/diff-viewer').then((m) => ({ default: m.DiffViewer }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="Diff 查看器" />
        <PlaygroundMain>
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <DiffViewer />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/diff-viewer')({
  component: RouteComponent
});
