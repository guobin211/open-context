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

const FileManager = lazyRouteComponent(() =>
  import('@/components/playground/file-manager').then((m) => ({ default: m.FileManager }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="文件管理器" />
        <PlaygroundMain>
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <FileManager />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/file-manager')({
  component: RouteComponent
});
