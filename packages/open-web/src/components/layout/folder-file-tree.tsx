import React, { useState } from 'react';
import { ChevronRight, File, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface FolderFileTreeProps {
  nodes: FileNode[];
  onNodeClick?: (node: FileNode) => void;
}

export const FolderFileTree: React.FC<FolderFileTreeProps> = ({ nodes, onNodeClick }) => {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <FileTreeNode key={node.path} node={node} onNodeClick={onNodeClick} depth={0} />
      ))}
    </div>
  );
};

interface FileTreeNodeProps {
  node: FileNode;
  onNodeClick?: (node: FileNode) => void;
  depth: number;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({ node, onNodeClick, depth }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleClick = () => {
    onNodeClick?.(node);
  };

  const paddingLeft = depth * 12 + 8;

  return (
    <>
      <div
        onClick={handleClick}
        className="group flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-100"
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {node.isDirectory ? (
          <button onClick={handleToggle} className="flex h-4 w-4 items-center justify-center">
            <ChevronRight className={cn('h-3 w-3 text-gray-500 transition-transform', isExpanded && 'rotate-90')} />
          </button>
        ) : (
          <div className="h-4 w-4" />
        )}

        {node.isDirectory ? (
          <Folder className="h-4 w-4 shrink-0 text-amber-500" />
        ) : (
          <File className="h-4 w-4 shrink-0 text-gray-400" />
        )}

        <span className="truncate text-gray-700">{node.name}</span>
      </div>

      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeNode key={child.path} node={child} onNodeClick={onNodeClick} depth={depth + 1} />
          ))}
        </div>
      )}
    </>
  );
};

FileTreeNode.displayName = 'FileTreeNode';
