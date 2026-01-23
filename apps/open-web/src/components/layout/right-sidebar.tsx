import { open } from '@tauri-apps/plugin-dialog';
import { Clock, FilePlus, Folder, FolderOpen, FolderPlus, Search, TerminalSquare, Trash2, X } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { readDirectoryRecursive } from '../../services/folder-service';
import { type RecentFolder, useRightSidebarStore } from '../../storage/right-sidebar-store';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { FolderFileTree } from './folder-file-tree';

export const RightSidebar = () => {
  const {
    isOpen,
    folderPath,
    fileTree,
    isLoading,
    recentFolders,
    setFolderPath,
    setFileTree,
    setLoading,
    close,
    reset,
    initStore,
    addRecentFolder,
    removeRecentFolder
  } = useRightSidebarStore();

  // 初始化持久化存储
  useEffect(() => {
    initStore().catch(console.error);
  }, [initStore]);

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
      console.error('Error opening folder:');
      console.error(error);
      setLoading(false);
    }
  }, [loadFolder, setLoading]);

  const handleSelectRecentFolder = useCallback(
    async (folder: RecentFolder) => {
      await loadFolder(folder.path);
    },
    [loadFolder]
  );

  const handleRemoveRecentFolder = useCallback(
    async (e: React.MouseEvent, path: string) => {
      e.stopPropagation();
      await removeRecentFolder(path);
    },
    [removeRecentFolder]
  );

  const handleClose = useCallback(() => {
    close();
    reset();
  }, [close, reset]);

  const handleNewFile = useCallback(() => {
    // TODO: 实现新建文件功能
    console.log('New file in:', folderPath);
  }, [folderPath]);

  const handleNewFolder = useCallback(() => {
    // TODO: 实现新建文件夹功能
    console.log('New folder in:', folderPath);
  }, [folderPath]);

  const handleOpenTerminal = useCallback(() => {
    // TODO: 实现打开终端功能
    console.log('Open terminal in:', folderPath);
  }, [folderPath]);

  const handleSearch = useCallback(() => {
    // TODO: 实现搜索功能
    console.log('Search in:', folderPath);
  }, [folderPath]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-l border-gray-200 bg-[#F7F7F5]">
      {/* 头部 */}
      <div className="flex h-12 items-center justify-between border-b border-gray-200 px-3">
        <span className="text-sm font-medium text-gray-700">文件浏览器</span>
        <button
          onClick={handleClose}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 内容区 */}
      {!folderPath ? (
        // 未打开文件夹时显示打开按钮和最近打开列表
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-col items-center gap-4 border-b border-gray-200 p-4">
            <FolderOpen className="h-10 w-10 text-gray-300" />
            <p className="text-center text-sm text-gray-500">选择文件夹来浏览文件</p>
            <Button onClick={handleOpenFolder} variant="outline" size="sm" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              打开文件夹
            </Button>
          </div>

          {/* 最近打开的文件夹 */}
          {recentFolders.length > 0 && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>最近打开</span>
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-0.5 px-2 pb-2">
                  {recentFolders.map((folder) => (
                    <div
                      key={folder.path}
                      onClick={() => handleSelectRecentFolder(folder)}
                      className="group flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <Folder className="h-4 w-4 shrink-0 text-amber-500" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{folder.name}</p>
                        <p className="truncate text-xs text-gray-400" title={folder.path}>
                          {folder.path}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleRemoveRecentFolder(e, folder.path)}
                        className="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600"
                        title="从列表中移除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      ) : (
        // 已打开文件夹时显示文件树
        <div className="flex min-h-0 flex-1 flex-col">
          {/* 当前路径和操作按钮 */}
          <div className="border-b border-gray-200 px-3 py-2">
            <p className="truncate text-xs text-gray-500" title={folderPath}>
              {folderPath}
            </p>
            <TooltipProvider delayDuration={300}>
              <div className="mt-1.5 flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewFile}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FilePlus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>新建文件</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleNewFolder}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <FolderPlus className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>新建文件夹</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleOpenTerminal}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <TerminalSquare className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>新建终端</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleSearch}
                      className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>搜索</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
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
                <FolderFileTree nodes={fileTree} />
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </aside>
  );
};
