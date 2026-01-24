import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

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
          <MonacoEditor />
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/code-editor')({
  component: RouteComponent
});
