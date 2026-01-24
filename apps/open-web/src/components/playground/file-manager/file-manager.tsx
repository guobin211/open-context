import { useState } from 'react';
import { File, Folder, Image as ImageIcon, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  thumbnail?: string;
}

const DEMO_FILES: FileItem[] = [
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    modified: new Date(2026, 0, 20)
  },
  {
    id: '2',
    name: 'Pictures',
    type: 'folder',
    modified: new Date(2026, 0, 19)
  },
  {
    id: '3',
    name: 'Projects',
    type: 'folder',
    modified: new Date(2026, 0, 18)
  },
  {
    id: '4',
    name: 'README.md',
    type: 'file',
    size: 2048,
    modified: new Date(2026, 0, 23)
  },
  {
    id: '5',
    name: 'package.json',
    type: 'file',
    size: 1024,
    modified: new Date(2026, 0, 22)
  },
  {
    id: '6',
    name: 'screenshot.png',
    type: 'file',
    size: 102400,
    modified: new Date(2026, 0, 21)
  },
  {
    id: '7',
    name: 'report.pdf',
    type: 'file',
    size: 524288,
    modified: new Date(2026, 0, 20)
  },
  {
    id: '8',
    name: 'avatar.jpg',
    type: 'file',
    size: 51200,
    modified: new Date(2026, 0, 19)
  }
];

interface FileManagerProps {
  className?: string;
}

export const FileManager = ({ className }: FileManagerProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const selectedFile = DEMO_FILES.find((f) => f.id === selectedId);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return Folder;
    if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) return ImageIcon;
    if (file.name.endsWith('.md')) return FileText;
    return File;
  };

  return (
    <div className={cn('flex h-full gap-4', className)}>
      <div className="flex-1 overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">文件 ({DEMO_FILES.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded px-3 py-1 text-sm transition-colors',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
            >
              网格
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded px-3 py-1 text-sm transition-colors',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              )}
            >
              列表
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
            {DEMO_FILES.map((file) => {
              const Icon = getFileIcon(file);
              const isSelected = selectedId === file.id;

              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedId(file.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                    isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon
                    className={cn('size-12', file.type === 'folder' ? 'text-yellow-500' : 'text-muted-foreground')}
                  />
                  <span className="truncate text-sm">{file.name}</span>
                  <span className="text-muted-foreground text-xs">{formatSize(file.size)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-1 overflow-y-auto">
            {DEMO_FILES.map((file) => {
              const Icon = getFileIcon(file);
              const isSelected = selectedId === file.id;

              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedId(file.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors',
                    isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                  )}
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0',
                      file.type === 'folder' ? 'text-yellow-500' : 'text-muted-foreground'
                    )}
                  />
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <span className="text-muted-foreground text-xs">{formatSize(file.size)}</span>
                  <span className="text-muted-foreground text-xs">{file.modified.toLocaleDateString('zh-CN')}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="border-border bg-card w-80 shrink-0 rounded-lg border p-4">
          <h3 className="mb-4 text-lg font-semibold">详情</h3>
          <div className="space-y-3">
            <div>
              <span className="text-muted-foreground text-sm">名称</span>
              <p className="text-sm font-medium">{selectedFile.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm">类型</span>
              <p className="text-sm font-medium">{selectedFile.type === 'folder' ? '文件夹' : '文件'}</p>
            </div>
            {selectedFile.size && (
              <div>
                <span className="text-muted-foreground text-sm">大小</span>
                <p className="text-sm font-medium">{formatSize(selectedFile.size)}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground text-sm">修改时间</span>
              <p className="text-sm font-medium">{selectedFile.modified.toLocaleString('zh-CN')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
