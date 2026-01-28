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

const ExcelToJson = lazyRouteComponent(() =>
  import('@/components/playground/excel-to-json').then((m) => ({ default: m.ExcelToJson }))
);

const RouteComponent = () => {
  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="Excel 转 JSON" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <ExcelToJson />
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/excel-to-json')({
  component: RouteComponent
});
