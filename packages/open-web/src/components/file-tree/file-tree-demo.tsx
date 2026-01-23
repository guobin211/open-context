import React, { useState } from 'react';
import { FileTree } from '@/components/file-tree';
import type { FileTreeNode } from '@/services';

export const FileTreeDemo: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<FileTreeNode | null>(null);
  const rootPath = '/Users/example/projects';

  const handleNodeSelect = (node: FileTreeNode) => {
    setSelectedNode(node);
    console.log('Selected node:', node);
  };

  return (
    <div className="flex h-screen">
      <div className="flex w-80 flex-col border-r">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">文件浏览器</h2>
          <p className="text-muted-foreground text-sm">VSCode 风格文件树</p>
        </div>

        <FileTree
          rootPath={rootPath}
          onNodeSelect={handleNodeSelect}
          showBreadcrumb={true}
          showSearch={true}
          className="flex-1"
        />
      </div>

      <div className="flex-1 p-4">
        <h2 className="mb-4 text-lg font-semibold">文件详情</h2>
        {selectedNode ? (
          <div className="space-y-2">
            <div>
              <span className="font-medium">名称:</span> {selectedNode.name}
            </div>
            <div>
              <span className="font-medium">路径:</span> {selectedNode.path}
            </div>
            <div>
              <span className="font-medium">类型:</span> {selectedNode.isDirectory ? '目录' : '文件'}
            </div>
            {selectedNode.size && (
              <div>
                <span className="font-medium">大小:</span> {(selectedNode.size / 1024).toFixed(2)} KB
              </div>
            )}
            {selectedNode.modified && (
              <div>
                <span className="font-medium">修改时间:</span> {new Date(selectedNode.modified).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">请选择一个文件或目录</p>
        )}
      </div>
    </div>
  );
};

export const FileTreeWithContextMenuDemo: React.FC = () => {
  const rootPath = '/Users/example/projects';

  return (
    <div className="h-screen w-80 border-r">
      <FileTree rootPath={rootPath} onNodeSelect={(node) => console.log('Selected:', node)} />
    </div>
  );
};
