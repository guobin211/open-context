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

const ImageEditor = lazyRouteComponent(() =>
  import('@/components/playground/image-editor').then((m) => ({ default: m.ImageEditor }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="图片编辑器" />
        <PlaygroundMain>
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <ImageEditor />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/image-editor')({
  component: RouteComponent
});
