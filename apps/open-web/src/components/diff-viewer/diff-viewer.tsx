import { useState } from 'react';
import { Diff, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiffViewerProps {
  className?: string;
}

export const DiffViewer = ({ className }: DiffViewerProps) => {
  const [oldText, setOldText] = useState<string>(
    `function hello() {
  console.log("Hello, World!");
  return "Hello";
}`
  );
  const [newText, setNewText] = useState<string>(
    `function hello() {
  console.log("Hello, World!");
  console.log("This is a new line");
  return "Hello, Updated!";
}`
  );
  const [diffResult, setDiffResult] = useState<any[] | null>(null);

  const handleCompare = async () => {
    const diff = await import('diff');
    const result = (diff as any).diffLines(oldText, newText);
    setDiffResult(result);
  };

  const handleChangeDiff = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOldText(e.target.value);
    setDiffResult(null);
  };

  const handleChangeNew = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewText(e.target.value);
    setDiffResult(null);
  };

  const renderDiff = () => {
    if (!diffResult || diffResult.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">点击"开始比较"查看差异</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-muted overflow-auto rounded-lg p-4 font-mono text-sm">
        {diffResult.map((change, index) => {
          if (change.added) {
            return (
              <div key={index} className="border-l-2 border-green-600 bg-green-600/20 px-2 py-0.5">
                <span className="mr-2 text-green-600">+</span>
                <span className="text-green-700">{change.value}</span>
              </div>
            );
          }
          if (change.removed) {
            return (
              <div key={index} className="border-l-2 border-red-600 bg-red-600/20 px-2 py-0.5">
                <span className="mr-2 text-red-600">-</span>
                <span className="text-red-700 line-through">{change.value}</span>
              </div>
            );
          }
          return (
            <div key={index} className="bg-gray-600/10 px-2 py-0.5">
              <span className="text-muted">{change.value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const countDiffs = () => {
    if (!diffResult) return { added: 0, removed: 0 };
    return {
      added: diffResult.filter((d) => d.added).length,
      removed: diffResult.filter((d) => d.removed).length
    };
  };

  const stats = countDiffs();

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-[400px] flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-muted-foreground mb-2 block text-sm font-semibold">旧版本</label>
            <textarea
              value={oldText}
              onChange={handleChangeDiff}
              className="bg-muted text-muted-foreground focus:ring-primary resize-none rounded-lg p-3 font-mono text-sm focus:ring-2 focus:outline-none"
              rows={10}
            />
          </div>
          <div className="flex items-center justify-center">
            <ArrowRight className="text-muted-foreground size-5" />
          </div>
          <div className="flex-1">
            <label className="text-muted-foreground mb-2 block text-sm font-semibold">新版本</label>
            <textarea
              value={newText}
              onChange={handleChangeNew}
              className="bg-muted text-muted-foreground focus:ring-primary resize-none rounded-lg p-3 font-mono text-sm focus:ring-2 focus:outline-none"
              rows={10}
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          <Diff className="size-4" />
          开始比较
        </button>

        {diffResult && (
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-semibold">差异统计</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">新增行:</span>
                <span className="font-medium text-green-600">{stats.added}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">删除行:</span>
                <span className="font-medium text-red-600">{stats.removed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">总变更:</span>
                <span className="text-primary font-medium">{stats.added + stats.removed}</span>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">图例说明</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="size-4 rounded border-l-2 border-green-600 bg-green-600/20" />
              <span>绿色: 新增内容</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="size-4 rounded border-l-2 border-red-600 bg-red-600/20" />
              <span>红色: 删除内容</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="size-4 rounded bg-gray-600/10" />
              <span>灰色: 未修改</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">功能说明</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>使用 diff 库进行行级差异比较</li>
            <li>支持实时编辑和自动重新比较</li>
            <li>以不同颜色标识新增、删除和未修改内容</li>
            <li>显示变更统计信息</li>
          </ul>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold">差异视图</h3>
            {diffResult && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">
                {stats.added + stats.removed} 处变更
              </span>
            )}
          </div>
          {renderDiff()}
        </div>
      </div>
    </div>
  );
};
