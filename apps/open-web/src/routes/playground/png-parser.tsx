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

const PngParser = lazyRouteComponent(() =>
  import('@/components/playground/png-parser').then((m) => ({ default: m.PngParser }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="PNG 解析器" />
        <PlaygroundMain>
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <PngParser />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/png-parser')({
  component: RouteComponent
});
