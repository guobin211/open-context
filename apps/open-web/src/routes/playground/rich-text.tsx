import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

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
            <SimpleEditor />
          </div>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/rich-text')({
  component: RouteComponent
});
