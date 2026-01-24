import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

const WebBrowser = lazyRouteComponent(() =>
  import('@/components/playground/webview').then((m) => ({ default: m.WebBrowser }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="网页浏览器" />
        <PlaygroundMain className="p-0">
          <WebBrowser />
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/webview')({
  component: RouteComponent
});
