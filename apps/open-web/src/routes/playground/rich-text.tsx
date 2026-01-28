import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import { Suspense } from 'react';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/routes/playground/components';
import { PlaygroundNavigation } from '@/components/navigation';

const SimpleEditor = lazyRouteComponent(() =>
  import('@/components/tiptap-templates/simple/simple-editor').then((m) => ({ default: m.SimpleEditor }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="富文本编辑器" />
        <PlaygroundMain>
          <div className="border-border h-full rounded-lg border">
            <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
              <SimpleEditor />
            </Suspense>
          </div>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/rich-text')({
  component: RouteComponent
});
