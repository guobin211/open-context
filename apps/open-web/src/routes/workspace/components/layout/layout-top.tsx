import { cn } from '@/lib/utils';
import {
  X,
  Minus,
  Square,
  PanelLeft,
  PanelRight,
  Settings,
  Plus,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Maximize2
} from 'lucide-react';
import type { LayoutState } from './layout';

interface LayoutTopProps {
  layoutState: LayoutState;
}

/**
 * 顶部Tabs栏组件
 * 包含窗口控制按钮、侧栏切换、Tab管理、分屏控制等功能
 */
export const LayoutTop = ({ layoutState }: LayoutTopProps) => {
  const {
    leftSidebarVisible,
    rightSidebarVisible,
    setLeftSidebarVisible,
    setRightSidebarVisible,
    editorTabs,
    activeTabId,
    setActiveTabId,
    splitMode,
    setSplitMode,
    handleAddTab,
    handleCloseTab,
    handleOpenFile,
    handleToggleSplit
  } = layoutState;

  return (
    <div className="flex h-[40px] items-center border-b border-[#2d2d2d] bg-[#2d2d2d] text-[#cccccc]">
      {/* 窗口控制按钮 */}
      <div className="flex items-center gap-2 px-3">
        <button className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-[#ff5f56] hover:brightness-90">
          <X className="h-[8px] w-[8px] opacity-0 hover:opacity-100" />
        </button>
        <button className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-[#ffbd2e] hover:brightness-90">
          <Minus className="h-[8px] w-[8px] opacity-0 hover:opacity-100" />
        </button>
        <button className="flex h-[12px] w-[12px] items-center justify-center rounded-full bg-[#27c93f] hover:brightness-90">
          <Square className="h-[8px] w-[8px] opacity-0 hover:opacity-100" />
        </button>
      </div>

      {/* 左侧栏切换按钮 */}
      <button
        onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
        className="ml-2 flex items-center gap-1 px-3 py-1 text-sm hover:bg-[#3e3e3e]"
      >
        <PanelLeft className="h-4 w-4" />
        <span>{leftSidebarVisible ? '隐藏' : '显示'}左侧栏</span>
      </button>

      {/* 新增Tab按钮 */}
      <button
        onClick={handleAddTab}
        className="ml-1 flex items-center justify-center rounded px-2 py-1 hover:bg-[#3e3e3e]"
        title="新增Tab"
      >
        <Plus className="h-4 w-4" />
      </button>

      {/* 打开文件按钮 */}
      <button
        onClick={handleOpenFile}
        className="ml-1 px-3 py-1 text-sm hover:bg-[#3e3e3e]"
        title="打开文件"
      >
        打开文件
      </button>

      {/* 编辑器Tabs列表 */}
      <div className="flex flex-1 items-center overflow-x-auto">
        {editorTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={cn(
              'group relative flex h-[40px] items-center gap-2 border-r border-[#2d2d2d] px-4 text-sm',
              activeTabId === tab.id
                ? 'bg-[#1e1e1e] text-white'
                : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#3e3e3e]'
            )}
          >
            <span className="max-w-[150px] truncate">{tab.title}</span>
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="rounded p-0.5 opacity-0 hover:bg-[#5a5a5a] group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
            {activeTabId === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#007acc]" />
            )}
          </button>
        ))}
      </div>

      {/* 右侧操作按钮组 */}
      <div className="flex items-center gap-1 px-2">
        {/* 水平分屏按钮 */}
        <button
          onClick={() => handleToggleSplit('horizontal')}
          className={cn(
            'rounded p-2 hover:bg-[#3e3e3e]',
            splitMode === 'horizontal' && 'bg-[#3e3e3e]'
          )}
          title="水平分屏"
        >
          <SplitSquareHorizontal className="h-4 w-4" />
        </button>

        {/* 垂直分屏按钮 */}
        <button
          onClick={() => handleToggleSplit('vertical')}
          className={cn('rounded p-2 hover:bg-[#3e3e3e]', splitMode === 'vertical' && 'bg-[#3e3e3e]')}
          title="垂直分屏"
        >
          <SplitSquareVertical className="h-4 w-4" />
        </button>

        {/* 恢复单屏按钮 */}
        {splitMode !== 'none' && (
          <button
            onClick={() => setSplitMode('none')}
            className="rounded p-2 hover:bg-[#3e3e3e]"
            title="恢复单屏"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* 左侧栏按钮 */}
        <button
          onClick={() => setLeftSidebarVisible(!leftSidebarVisible)}
          className={cn('rounded p-2 hover:bg-[#3e3e3e]', leftSidebarVisible && 'bg-[#3e3e3e]')}
          title="切换左侧栏"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        {/* 右侧栏按钮 */}
        <button
          onClick={() => setRightSidebarVisible(!rightSidebarVisible)}
          className={cn('rounded p-2 hover:bg-[#3e3e3e]', rightSidebarVisible && 'bg-[#3e3e3e]')}
          title="切换右侧栏"
        >
          <PanelRight className="h-4 w-4" />
        </button>

        {/* 设置按钮 */}
        <button className="rounded p-2 hover:bg-[#3e3e3e]" title="打开设置">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};