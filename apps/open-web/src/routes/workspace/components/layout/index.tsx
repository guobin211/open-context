import { useLayoutState, useDragResize } from './layout';
import { LayoutTop } from './layout-top';
import { LayoutLeft } from './layout-left';
import { LayoutRight } from './layout-right';
import { LayoutContent } from './layout-content';

/**
 * VSCode风格布局主组件
 * 集成顶部栏、左侧栏、右侧栏、编辑器区域
 */
export const VSCodeLayout = () => {
  // 布局状态管理
  const layoutState = useLayoutState();
  const {
    leftSidebarVisible,
    rightSidebarVisible,
    leftSidebarWidth,
    rightSidebarWidth,
    setLeftSidebarWidth,
    setRightSidebarWidth,
    editorTabs,
    activeTabId,
    splitMode,
    splitRatio,
    setSplitRatio,
    handleContentChange
  } = layoutState;

  // 拖拽功能
  const {
    setIsDraggingLeft,
    setIsDraggingRight,
    setIsDraggingSplit,
    dragCallbacksRef
  } = useDragResize();

  // 设置拖拽回调
  dragCallbacksRef.current = {
    onLeftDrag: (e: MouseEvent) => {
      const newWidth = Math.max(100, Math.min(400, e.clientX));
      setLeftSidebarWidth(newWidth);
    },
    onRightDrag: (e: MouseEvent) => {
      const newWidth = Math.max(100, Math.min(400, window.innerWidth - e.clientX));
      setRightSidebarWidth(newWidth);
    },
    onSplitDrag: (e: MouseEvent) => {
      const container = document.getElementById('editor-container');
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let ratio: number;

      if (splitMode === 'horizontal') {
        ratio = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        ratio = ((e.clientY - rect.top) / rect.height) * 100;
      }

      setSplitRatio(Math.max(20, Math.min(80, ratio)));
    }
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#1e1e1e]">
      {/* 顶部Tabs栏 */}
      <LayoutTop layoutState={layoutState} />

      {/* 主体三栏布局 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧栏 */}
        {leftSidebarVisible && (
          <LayoutLeft
            width={leftSidebarWidth}
            onDragStart={() => setIsDraggingLeft(true)}
          />
        )}

        {/* 中间编辑器区域 */}
        <LayoutContent
          editorTabs={editorTabs}
          activeTabId={activeTabId}
          splitMode={splitMode}
          splitRatio={splitRatio}
          onContentChange={handleContentChange}
          onSplitDragStart={() => setIsDraggingSplit(true)}
        />

        {/* 右侧栏 */}
        {rightSidebarVisible && (
          <LayoutRight
            width={rightSidebarWidth}
            onDragStart={() => setIsDraggingRight(true)}
          />
        )}
      </div>
    </div>
  );
};

// 导出类型
export type { EditorTab, SplitMode, LayoutState } from './layout';