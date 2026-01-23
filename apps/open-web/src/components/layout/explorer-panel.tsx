import { FolderOpen, MoreHorizontal, ChevronRight, ChevronDown, File, Folder } from 'lucide-react';
import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useRightSidebarStore, type FileNode } from '@/storage';
import { readDirectoryRecursive } from '@/services/folder-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HEADER_HEIGHT } from './constants';

interface FileTreeItemProps {
  node: FileNode;
  level: number;
}

const FileTreeItem = ({ node, level }: FileTreeItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (node.isDirectory) {
      setIsExpanded(!isExpanded);
    }
  };

  // 获取文件图标颜色
  const getFileIconColor = () => {
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
        return 'text-yellow-500';
      case 'ts':
      case 'tsx':
        return 'text-blue-500';
      case 'css':
      case 'scss':
        return 'text-pink-500';
      case 'html':
        return 'text-orange-500';
      case 'json':
        return 'text-green-500';
      case 'md':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm transition-colors hover:bg-gray-100',
          level === 0 ? 'font-medium' : ''
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            )}
            <Folder className={cn('h-4 w-4 shrink-0', isExpanded ? 'text-amber-500' : 'text-amber-400')} />
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <File className={cn('h-4 w-4 shrink-0', getFileIconColor())} />
          </>
        )}
        <span className="truncate text-gray-700">{node.name}</span>
      </button>

      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ExplorerPanel = () => {
  const { folderPath, fileTree, isLoading, setFolderPath, setFileTree, setLoading, addRecentFolder } =
    useRightSidebarStore();

  const loadFolder = useCallback(
    async (path: string) => {
      setLoading(true);
      setFolderPath(path);

      const tree = await readDirectoryRecursive(path);
      setFileTree(tree);
      await addRecentFolder(path);
      setLoading(false);
    },
    [setFolderPath, setFileTree, setLoading, addRecentFolder]
  );

  const handleOpenFolder = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: '选择文件夹'
      });

      if (selected && typeof selected === 'string') {
        await loadFolder(selected);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
      setLoading(false);
    }
  }, [loadFolder, setLoading]);

  // 获取文件夹名称
  const folderName = folderPath ? folderPath.split('/').pop() || folderPath : null;

  return (
    <aside className="flex h-full w-60 flex-col border-l border-gray-200 bg-[#F7F7F5]">
      {/* 头部 */}
      <div className={`flex ${HEADER_HEIGHT} items-center justify-between border-b border-gray-200 px-3`}>
        <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Explorer</span>
        <button className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* 内容区 */}
      {!folderPath ? (
        // 未打开文件夹时显示空状态
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
            <FolderOpen className="h-6 w-6 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">No Folder Opened</p>
            <p className="mt-1 text-xs text-gray-500">You have not yet opened a folder.</p>
          </div>
          <Button onClick={handleOpenFolder} size="sm" className="bg-primary hover:bg-primary/90 mt-2">
            Open Folder
          </Button>
        </div>
      ) : (
        // 已打开文件夹时显示文件树
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 文件夹名称 */}
          <div className="border-b border-gray-200 px-3 py-2">
            <div className="flex items-center gap-2">
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              <Folder className="h-4 w-4 text-amber-500" />
              <span className="truncate text-sm font-medium text-gray-700">{folderName}</span>
            </div>
          </div>

          {/* 文件树 */}
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-400">加载中...</span>
                </div>
              ) : fileTree.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-sm text-gray-400">文件夹为空</span>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {fileTree.map((node) => (
                    <FileTreeItem key={node.path} node={node} level={0} />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
};
