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

const QrcodeGenerator = lazyRouteComponent(() =>
  import('@/components/playground/qrcode-generator').then((m) => ({ default: m.QrcodeGenerator }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="二维码生成器" />
        <PlaygroundMain>
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <QrcodeGenerator />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/qrcode-generator')({
  component: RouteComponent
});
