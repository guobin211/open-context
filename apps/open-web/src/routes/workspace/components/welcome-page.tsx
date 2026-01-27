import { Code2, Download, FilePlus, Book, Keyboard, PlayCircle, Folder } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useCallback } from 'react';
import { useRightSidebarStore, type RecentFolder } from '@/storage';
import { readDirectoryRecursive } from '@/services/folder-service';
import { Logo } from './logo';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const ActionCard = ({ icon, title, description, onClick }: ActionCardProps) => (
  <button
    onClick={onClick}
    className="flex w-44 flex-col items-center gap-3 rounded-lg border border-gray-200 bg-white px-6 py-6 transition-all hover:border-gray-300 hover:shadow-sm"
  >
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">{icon}</div>
    <div className="text-center">
      <p className="text-sm font-medium text-gray-900">{title}</p>
      <p className="text-primary mt-0.5 text-xs">{description}</p>
    </div>
  </button>
);

interface RecentItemProps {
  folder: RecentFolder;
  onClick: () => void;
}

const RecentItem = ({ folder, onClick }: RecentItemProps) => {
  // 根据文件夹名称判断图标类型
  const getIcon = () => {
    const name = folder.name.toLowerCase();
    if (name.includes('ui') || name.includes('dashboard')) {
      return <Folder className="h-5 w-5 text-amber-500" />;
    }
    if (name.includes('api') || name.includes('service') || name.includes('backend')) {
      return <Code2 className="h-5 w-5 text-blue-500" />;
    }
    return <Code2 className="h-5 w-5 text-gray-500" />;
  };

  // 计算相对时间
  const getRelativeTime = () => {
    const now = Date.now();
    const diff = now - folder.lastAccessed;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-100 bg-white px-4 py-3 text-left transition-all hover:border-gray-200 hover:bg-gray-50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">{getIcon()}</div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{folder.name}</p>
        <p className="truncate text-xs text-gray-500">{folder.path}</p>
      </div>
      <span className="shrink-0 text-xs text-gray-400">{getRelativeTime()}</span>
    </button>
  );
};

export const WelcomePage = () => {
  const {
    recentFolders,
    setFolderPath,
    setFileTree,
    setLoading,
    addRecentFolder,
    open: openSidebar
  } = useRightSidebarStore();

  const loadFolder = useCallback(
    async (path: string) => {
      setLoading(true);
      setFolderPath(path);
      openSidebar();

      const tree = await readDirectoryRecursive(path);
      setFileTree(tree);
      await addRecentFolder(path);
      setLoading(false);
    },
    [setFolderPath, setFileTree, setLoading, addRecentFolder, openSidebar]
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

  const handleCloneRepository = useCallback(() => {
    // TODO: 实现克隆仓库功能
    console.log('Clone repository');
  }, []);

  const handleNewFile = useCallback(() => {
    // TODO: 实现新建文件功能
    console.log('New file');
  }, []);

  const handleSelectRecentFolder = useCallback(
    async (folder: RecentFolder) => {
      await loadFolder(folder.path);
    },
    [loadFolder]
  );

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-8">
      <div data-tauri-drag-region className="h-10 w-full"></div>
      <div className="h-full w-full max-w-2xl">
        {/* Logo 和标题 */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <Logo className="text-3xl font-semibold" />
          </div>
          <p className="mt-2 text-sm text-gray-500">Version 0.1.1 • Start coding instantly</p>
        </div>

        {/* 操作卡片 */}
        <div className="mb-10 flex justify-center gap-4">
          <ActionCard
            icon={<FilePlus className="h-5 w-5" />}
            title="Open Folder"
            description="Navigate local files"
            onClick={handleOpenFolder}
          />
          <ActionCard
            icon={<Download className="h-5 w-5" />}
            title="Clone Repository"
            description="Get from GitHub"
            onClick={handleCloneRepository}
          />
          <ActionCard
            icon={<FilePlus className="h-5 w-5" />}
            title="New File"
            description="Start from scratch"
            onClick={handleNewFile}
          />
        </div>

        {/* 最近项目 */}
        {recentFolders.length > 0 && (
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-gray-500 uppercase">Recent</span>
              <button className="text-primary text-xs hover:underline">View All</button>
            </div>
            <div className="space-y-2">
              {recentFolders.slice(0, 3).map((folder) => (
                <RecentItem key={folder.path} folder={folder} onClick={() => handleSelectRecentFolder(folder)} />
              ))}
            </div>
          </div>
        )}

        {/* 底部链接 */}
        <div className="flex items-center justify-center gap-6 border-t border-gray-100 pt-6">
          <button className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <Book className="h-4 w-4" />
            <span>Documentation</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <Keyboard className="h-4 w-4" />
            <span>Keyboard Shortcuts</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700">
            <PlayCircle className="h-4 w-4" />
            <span>Intro Video</span>
          </button>
        </div>
      </div>
      <div data-tauri-drag-region className="h-10 w-full"></div>
    </div>
  );
};
