import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/components/playground/layout';
import { PlaygroundNavigation } from '@/components/playground/navigation';

const CosUpload = lazyRouteComponent(() =>
  import('@/components/playground/cos-upload').then((m) => ({ default: m.CosUpload }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="云存储上传" />
        <PlaygroundMain>
          <CosUpload />
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/cos-upload')({
  component: RouteComponent
});
