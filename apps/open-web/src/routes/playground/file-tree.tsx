import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useState } from 'react';
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/routes/playground/components';
import { FileTree } from '@/components/core/file-tree';
import { PlaygroundNavigation } from '@/components/features/navigation';

const RouteComponent = () => {
  const [selectedNode, setSelectedNode] = useState<{ path: string; isDirectory: boolean } | null>(null);

  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <PlaygroundNavigation />
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="文件树" />
        <PlaygroundMain className="p-0">
          <Suspense fallback={<div className="flex h-full items-center justify-center">加载中...</div>}>
            <div className="h-full p-4">
              <FileTree
                rootPath="/Users/guobin/tencent/open-context"
                onNodeSelect={(node) => setSelectedNode({ path: node.path, isDirectory: node.isDirectory })}
              />
              {selectedNode && (
                <div className="mt-4 rounded border border-border bg-muted p-4">
                  <p className="text-sm">
                    <strong>已选择:</strong> {selectedNode.path}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    类型: {selectedNode.isDirectory ? '目录' : '文件'}
                  </p>
                </div>
              )}
            </div>
          </Suspense>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/file-tree')({
  component: RouteComponent
});
