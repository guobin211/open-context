interface LayoutLeftProps {
  width: number;
  onDragStart: () => void;
}

/**
 * 左侧栏组件
 * 显示文件浏览器等内容，支持拖拽调整宽度
 */
export const LayoutLeft = ({ width, onDragStart }: LayoutLeftProps) => {
  return (
    <>
      <div className="border-r border-[#2d2d2d] bg-[#252526]" style={{ width: `${width}px` }}>
        <div className="p-4 text-[#cccccc]">
          <h3 className="mb-2 text-sm font-semibold">文件浏览器</h3>
          <div className="text-xs text-[#969696]">左侧栏内容区域</div>
        </div>
      </div>

      {/* 拖拽分隔线 */}
      <div
        onMouseDown={onDragStart}
        className="w-[4px] cursor-col-resize bg-[#2d2d2d] hover:bg-[#007acc]"
      />
    </>
  );
};