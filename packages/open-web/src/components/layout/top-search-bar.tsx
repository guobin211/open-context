import { Search, LayoutGrid, Square, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { HEADER_HEIGHT } from './constants';

type ViewMode = 'grid' | 'card' | 'list';

export const TopSearchBar = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  return (
    <div
      data-tauri-drag-region
      className={`flex ${HEADER_HEIGHT} items-center justify-between border-b border-gray-100 bg-white px-4`}
    >
      {/* 左侧占位 - 保持拖拽区域 */}
      <div data-tauri-drag-region className="w-24" />

      {/* 中间搜索框 */}
      <div className="w-[380px]">
        <div className="relative flex h-7 items-center rounded-md border border-gray-200 bg-gray-50 transition-colors focus-within:border-gray-300 focus-within:bg-white">
          <Search className="ml-2.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search project..."
            className="h-full flex-1 bg-transparent px-2 text-xs text-gray-700 placeholder-gray-400 outline-none"
          />
          <kbd className="mr-2 shrink-0 rounded border border-gray-200 bg-white px-1 text-[10px] leading-4 text-gray-400">
            ⌘P
          </kbd>
        </div>
      </div>

      {/* 右侧视图切换 */}
      <div className="flex w-24 items-center justify-end gap-1">
        <button
          onClick={() => setViewMode('grid')}
          className={cn(
            'rounded p-1.5 transition-colors',
            viewMode === 'grid' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          )}
          title="网格视图"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('card')}
          className={cn(
            'rounded p-1.5 transition-colors',
            viewMode === 'card' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          )}
          title="卡片视图"
        >
          <Square className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={cn(
            'rounded p-1.5 transition-colors',
            viewMode === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
          )}
          title="列表视图"
        >
          <Rows3 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
