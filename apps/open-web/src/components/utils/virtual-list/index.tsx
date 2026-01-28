import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export const VirtualList = () => {
  const parentRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        title: `Item ${i + 1}`,
        description: `This is the description for item ${i + 1}. It contains some random text to make the item more realistic.`
      })),
    []
  );

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="text-muted-foreground text-sm">共 {items.length.toLocaleString()} 条数据，使用虚拟列表渲染</div>

      <div ref={parentRef} className="flex-1 overflow-auto rounded-lg border">
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                className="border-b p-4"
              >
                <div className="font-medium">{item.title}</div>
                <div className="text-muted-foreground text-sm">{item.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
