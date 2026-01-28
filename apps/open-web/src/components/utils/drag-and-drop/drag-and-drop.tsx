import { useState } from 'react';
import { ArrowRight, Trash2, Move } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DragAndDropDemoProps {
  className?: string;
}

export const DragAndDropDemo = ({ className }: DragAndDropDemoProps) => {
  /**
   * oxlint-ignore
   */
  const [droppedItems, setDroppedItems] = useState<any[]>([]);
  /**
   * oxlint-ignore
   */
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (draggedItem) {
      setDroppedItems([...droppedItems, draggedItem]);
      setDraggedItem(null);
    }
  };

  const handleRemove = (index: number) => {
    setDroppedItems(droppedItems.filter((_, i) => i !== index));
  };

  const sourceItems: any[] = [
    { id: 'task-1', content: '任务 1: 设计登录页面', color: '#ef4444' },
    { id: 'task-2', content: '任务 2: 实现用户管理', color: '#f59e0b' },
    { id: 'task-3', content: '任务 3: 集成支付接口', color: '#10b981' },
    { id: 'task-4', content: '任务 4: 编写单元测试', color: '#3b82f6' },
    { id: 'task-5', content: '任务 5: 部署到生产环境', color: '#8b5cf6' }
  ];

  const DraggableItem = ({ item }: { item: any }) => {
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, item)}
        onDragEnd={() => setDraggedItem(null)}
        className="border-border bg-card hover:border-primary cursor-grab rounded-md border p-3 text-sm shadow-sm transition-colors select-none"
      >
        <div className="mb-2 flex items-center gap-2">
          <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
          <Move className="text-muted-foreground size-3" />
        </div>
        <div className="font-medium">{item.content}</div>
      </div>
    );
  };

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-87.5 flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Move className="size-5" />
            拖拽演示
          </h2>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">源区域</h3>
            <p className="text-muted-foreground mb-4 text-sm">拖拽以下任务到右侧目标区域</p>
            <div className="space-y-3">
              {sourceItems.map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">使用说明</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>使用原生 HTML5 Drag & Drop API</li>
            <li>支持拖拽到指定区域</li>
            <li>拖拽时保持视觉反馈</li>
            <li>支持移除已拖拽的项</li>
          </ul>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <ArrowRight className="size-5" />
              目标区域
            </h3>
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
              {droppedItems.length} 个任务
            </span>
          </div>

          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={cn(
              'bg-muted min-h-75 rounded-lg p-4 transition-colors',
              draggedItem ? 'border-primary bg-primary/5 border-2' : 'border border-dashed'
            )}
          >
            {droppedItems.length === 0 ? (
              <div className="py-8 text-center">
                <ArrowRight className="text-muted-foreground mx-auto mb-3 size-12" />
                <p className="text-muted-foreground text-sm">将任务从左侧拖拽到此处</p>
              </div>
            ) : (
              <div className="space-y-3">
                {droppedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="border-border bg-card flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font font-medium">{item.content}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      title="移除"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">功能特性</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>流畅的拖拽体验</li>
            <li>拖拽时保持视觉反馈</li>
            <li>原生 HTML5 API，无额外依赖</li>
            <li>支持多个项拖拽</li>
            <li>支持自定义拖拽数据</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
