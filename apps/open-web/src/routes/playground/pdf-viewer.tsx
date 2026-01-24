import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

const PdfViewer = lazyRouteComponent(() =>
  import('@/components/playground/pdf-viewer').then((m) => ({ default: m.PdfViewer }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="PDF 查看器" />
        <PlaygroundMain>
          <PdfViewer />
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/pdf-viewer')({
  component: RouteComponent
});
