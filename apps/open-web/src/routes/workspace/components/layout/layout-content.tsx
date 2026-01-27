import type { EditorTab, SplitMode } from './layout';

interface LayoutContentProps {
  editorTabs: EditorTab[];
  activeTabId: string;
  splitMode: SplitMode;
  splitRatio: number;
  onContentChange: (tabId: string, content: string) => void;
  onSplitDragStart: () => void;
}

/**
 * 编辑器内容区组件
 * 支持单屏、水平分屏、垂直分屏模式
 */
export const LayoutContent = ({
  editorTabs,
  activeTabId,
  splitMode,
  splitRatio,
  onContentChange,
  onSplitDragStart
}: LayoutContentProps) => {
  const activeTab = editorTabs.find((tab) => tab.id === activeTabId);

  return (
    <div id="editor-container" className="flex flex-1 flex-col overflow-hidden">
      {splitMode === 'none' ? (
        // 单屏模式
        <EditorPane tab={activeTab} onContentChange={(content) => activeTab && onContentChange(activeTab.id, content)} />
      ) : splitMode === 'horizontal' ? (
        // 水平分屏
        <div className="flex h-full">
          <div style={{ width: `${splitRatio}%` }}>
            <EditorPane tab={activeTab} onContentChange={(content) => activeTab && onContentChange(activeTab.id, content)} />
          </div>
          <div
            onMouseDown={onSplitDragStart}
            className="w-[4px] cursor-col-resize bg-[#2d2d2d] hover:bg-[#007acc]"
          />
          <div style={{ width: `${100 - splitRatio}%` }}>
            <EditorPane tab={activeTab} onContentChange={(content) => activeTab && onContentChange(activeTab.id, content)} />
          </div>
        </div>
      ) : (
        // 垂直分屏
        <div className="flex h-full flex-col">
          <div style={{ height: `${splitRatio}%` }}>
            <EditorPane tab={activeTab} onContentChange={(content) => activeTab && onContentChange(activeTab.id, content)} />
          </div>
          <div
            onMouseDown={onSplitDragStart}
            className="h-[4px] cursor-row-resize bg-[#2d2d2d] hover:bg-[#007acc]"
          />
          <div style={{ height: `${100 - splitRatio}%` }}>
            <EditorPane tab={activeTab} onContentChange={(content) => activeTab && onContentChange(activeTab.id, content)} />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 编辑器面板组件
 * 显示单个文件的编辑区域
 */
interface EditorPaneProps {
  tab?: EditorTab;
  onContentChange: (content: string) => void;
}

const EditorPane = ({ tab, onContentChange }: EditorPaneProps) => {
  if (!tab) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-[#969696]">
        无打开的文件
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* 编辑器顶部文件名 */}
      <div className="border-b border-[#2d2d2d] px-4 py-2 text-sm text-[#cccccc]">{tab.title}</div>

      {/* 编辑器主体 */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* 行号区域 */}
        <div className="w-[50px] border-r border-[#2d2d2d] bg-[#1e1e1e] py-2 text-right text-xs text-[#858585]">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="px-2">
              {i + 1}
            </div>
          ))}
        </div>

        {/* 编辑区域 */}
        <textarea
          value={tab.content}
          onChange={(e) => onContentChange(e.target.value)}
          className="flex-1 resize-none bg-[#1e1e1e] p-2 font-mono text-sm text-[#cccccc] outline-none"
          placeholder="在此输入代码..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};