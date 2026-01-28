import React, { useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FileTreeService, type FileTreeNode } from '@/services';
import { ChevronRight, Folder, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from './breadcrumb';
import { FileSearch } from './file-search';

interface FileTreeProps {
  rootPath: string;
  onNodeSelect?: (node: FileTreeNode) => void;
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  className?: string;
}

export const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  onNodeSelect,
  showBreadcrumb = true,
  showSearch = true,
  className
}) => {
  const [service] = useState(() => new FileTreeService(rootPath));
  const [nodes, setNodes] = useState<FileTreeNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>();
  const [currentPath, setCurrentPath] = useState(rootPath);
  const parentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      await service.initialize();
      const flatNodes = service.getFlattenedNodes();
      setNodes(flatNodes);
    };

    init().catch(console.error);

    const unsubscribe = service.onStateChange((state) => {
      const flatNodes = service.getFlattenedNodes();
      setNodes(flatNodes);
      setSelectedPath(state.selectedPath);
    });

    return () => {
      unsubscribe();
      service.destroy().catch(console.error);
    };
  }, [service]);

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 10
  });

  const handleToggle = async (node: FileTreeNode) => {
    if (node.isDirectory) {
      await service.toggleExpand(node.path);
    }
  };

  const handleSelect = (node: FileTreeNode) => {
    service.selectNode(node.path);
    setCurrentPath(node.isDirectory ? node.path : node.path.replace(/[^/]+$/, ''));
    onNodeSelect?.(node);
  };

  const handleBreadcrumbNavigate = async (path: string) => {
    const node = nodes.find((n) => n.path === path);
    if (node) {
      if (!node.isExpanded && node.isDirectory) {
        await service.toggleExpand(path);
      }
      handleSelect(node);
    }
  };

  const handleSearchSelect = async (filePath: string) => {
    const pathSegments = filePath.split('/');
    let currentSegmentPath = '';

    for (const segment of pathSegments.slice(0, -1)) {
      currentSegmentPath = currentSegmentPath ? `${currentSegmentPath}/${segment}` : segment;
      const node = nodes.find((n) => n.path === currentSegmentPath);

      if (node && node.isDirectory && !node.isExpanded) {
        await service.toggleExpand(currentSegmentPath);
      }
    }

    const targetNode = nodes.find((n) => n.path === filePath);
    if (targetNode) {
      handleSelect(targetNode);
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {showSearch && <FileSearch service={service} onSelectResult={handleSearchSelect} />}
      {showBreadcrumb && <Breadcrumb currentPath={currentPath} onNavigate={handleBreadcrumbNavigate} />}

      <div ref={parentRef} className="flex-1 overflow-auto" style={{ contain: 'strict' }}>
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const node = nodes[virtualItem.index];
            const isSelected = selectedPath === node.path;

            return (
              <div
                key={node.path}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`
                }}
              >
                <FileTreeItem node={node} isSelected={isSelected} onToggle={handleToggle} onSelect={handleSelect} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface FileTreeItemProps {
  node: FileTreeNode;
  isSelected: boolean;
  onToggle: (node: FileTreeNode) => void;
  onSelect: (node: FileTreeNode) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, isSelected, onToggle, onSelect }) => {
  const depth = node.depth ?? 0;
  const paddingLeft = depth * 16 + 8;

  return (
    <div
      className={cn('hover:bg-accent/50 flex h-7 cursor-pointer items-center select-none', isSelected && 'bg-accent')}
      style={{ paddingLeft: `${paddingLeft}px` }}
      onClick={() => onSelect(node)}
    >
      {node.isDirectory && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(node);
          }}
          className="mr-1 flex h-4 w-4 items-center justify-center"
        >
          {node.isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ChevronRight className={cn('h-3 w-3 transition-transform', node.isExpanded && 'rotate-90')} />
          )}
        </button>
      )}

      {!node.isDirectory && <div className="mr-1 h-4 w-4" />}

      {node.isDirectory ? (
        <Folder className="mr-2 h-4 w-4 text-blue-500" />
      ) : (
        <File className="mr-2 h-4 w-4 text-gray-500" />
      )}

      <span className="truncate text-sm">{node.name}</span>
    </div>
  );
};

FileTreeItem.displayName = 'FileTreeItem';
