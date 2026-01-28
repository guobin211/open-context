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

const DragAndDropDemo = lazyRouteComponent(() =>
  import('@/components/playground/drag-and-drop').then((m) => ({ default: m.DragAndDropDemo }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="拖拽演示" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <DragAndDropDemo />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/drag-and-drop')({
  component: RouteComponent
});
