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

const WordViewer = lazyRouteComponent(() =>
  import('@/components/playground/word-viewer').then((m) => ({ default: m.WordViewer }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="Word 查看器" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <WordViewer />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/word-viewer')({
  component: RouteComponent
});
