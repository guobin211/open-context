import { useState } from 'react';
import { FileTree } from '@/components/file-tree';
import type { FileTreeNode } from '@/services';
import { cn } from '@/lib/utils';

interface PlaygroundFileTreeProps {
  className?: string;
}

export const PlaygroundFileTree = ({ className }: PlaygroundFileTreeProps) => {
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const [rootPath, setRootPath] = useState<string>('/');

  const handleNodeSelect = (node: FileTreeNode) => {
    setSelectedNode(node);
    console.log('Selected node:', node);
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={cn('flex h-full gap-4', className)}>
      {/* 左侧：文件树 */}
      <div className="flex min-w-[300px] flex-col border-r">
        <div className="border-b p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              type="text"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder="输入根目录路径"
              className="bg-muted w-full rounded px-3 py-1.5 text-sm"
            />
          </div>
          <p className="text-muted-foreground text-xs">VS Code 风格文件树组件演示</p>
        </div>

        <FileTree
          rootPath={rootPath}
          onNodeSelect={handleNodeSelect}
          showBreadcrumb={true}
          showSearch={true}
          className="flex-1"
        />
      </div>

      {/* 右侧：文件详情 */}
      <div className="flex flex-1 flex-col overflow-auto p-4">
        <h2 className="mb-4 text-lg font-semibold">文件详情</h2>
        {selectedNode ? (
          <div className="space-y-3">
            <div className="rounded-lg border p-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">基本信息</h3>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">名称:</span>
                  <span className="text-right">{selectedNode.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">路径:</span>
                  <span className="max-w-md truncate text-right">{selectedNode.path}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">类型:</span>
                  <span className="text-right">{selectedNode.isDirectory ? '目录' : '文件'}</span>
                </div>
                {selectedNode.size && (
                  <div className="flex justify-between">
                    <span className="font-medium">大小:</span>
                    <span className="text-right">{formatSize(selectedNode.size)}</span>
                  </div>
                )}
                {selectedNode.modified && (
                  <div className="flex justify-between">
                    <span className="font-medium">修改时间:</span>
                    <span className="text-right">{new Date(selectedNode.modified).toLocaleString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">功能说明</h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>支持虚拟滚动，可流畅处理 10 万+ 文件</li>
                <li>按需加载，仅在展开目录时加载子节点</li>
                <li>实时监听文件系统变化（50ms 防抖）</li>
                <li>双层缓存：Rust 后端（5 分钟）+ 前端</li>
                <li>支持右键菜单：创建、重命名、删除、刷新</li>
                <li>面包屑导航和文件搜索功能</li>
                <li>跨平台支持：Windows、macOS、Linux</li>
              </ul>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="text-muted-foreground mb-3 text-sm font-semibold">性能基准</h3>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>初始加载: &lt; 100ms（空目录）</li>
                <li>展开目录: &lt; 80ms（1000 个文件）</li>
                <li>滚动帧率: 55-60 FPS（10 万+ 文件）</li>
                <li>内存占用: &lt; 20MB（10 万+ 文件）</li>
                <li>搜索速度: &lt; 500ms（10 万+ 文件）</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="text-muted-foreground mb-4 text-6xl">📁</div>
              <h3 className="mb-2 text-lg font-semibold">未选择文件</h3>
              <p className="text-muted-foreground text-sm">请在左侧选择一个文件或目录查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
