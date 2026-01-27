interface LayoutRightProps {
  width: number;
  onDragStart: () => void;
}

/**
 * 右侧栏组件
 * 显示属性面板等内容，支持拖拽调整宽度
 */
export const LayoutRight = ({ width, onDragStart }: LayoutRightProps) => {
  return (
    <>
      {/* 拖拽分隔线 */}
      <div
        onMouseDown={onDragStart}
        className="w-[4px] cursor-col-resize bg-[#2d2d2d] hover:bg-[#007acc]"
      />

      <div className="border-l border-[#2d2d2d] bg-[#252526]" style={{ width: `${width}px` }}>
        <div className="p-4 text-[#cccccc]">
          <h3 className="mb-2 text-sm font-semibold">属性面板</h3>
          <div className="text-xs text-[#969696]">右侧栏内容区域</div>
        </div>
      </div>
    </>
  );
};