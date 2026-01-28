import { useState } from 'react';
import JsonView from '@uiw/react-json-view';
import { cn } from '@/lib/utils';

interface JsonEditorProps {
  initialValue?: object;
  className?: string;
}

const DEFAULT_JSON = {
  name: 'Open Context',
  version: '1.0.0',
  description: 'AI Agent 上下文管理工具',
  features: ['对话管理', '笔记系统', '文件管理', '工作空间', 'RAG 检索'],
  config: {
    theme: 'dark',
    language: 'zh-CN',
    autoSave: true
  },
  metadata: {
    createdAt: '2026-01-23T21:00:00Z',
    updatedAt: '2026-01-23T21:00:00Z'
  }
};

export const JsonEditor = ({ initialValue = DEFAULT_JSON, className }: JsonEditorProps) => {
  const [jsonText, setJsonText] = useState(JSON.stringify(initialValue, null, 2));
  const [viewMode, setViewMode] = useState<'edit' | 'tree'>('edit');
  const [error, setError] = useState<string | null>(null);

  let parsedJson = initialValue;
  try {
    parsedJson = JSON.parse(jsonText);
    if (error) setError(null);
  } catch (e) {
    if (e instanceof Error && !error) {
      setError(e.message);
    }
  }

  const handleFormat = () => {
    try {
      const formatted = JSON.stringify(JSON.parse(jsonText), null, 2);
      setJsonText(formatted);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  const handleMinify = () => {
    try {
      const minified = JSON.stringify(JSON.parse(jsonText));
      setJsonText(minified);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-border flex items-center gap-2 border-b p-2">
        <button
          onClick={() => setViewMode('edit')}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            viewMode === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          编辑模式
        </button>
        <button
          onClick={() => setViewMode('tree')}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            viewMode === 'tree' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          树形视图
        </button>

        {viewMode === 'edit' && (
          <>
            <div className="bg-border mx-2 h-6 w-px" />
            <button onClick={handleFormat} className="hover:bg-accent rounded px-3 py-1 text-sm transition-colors">
              格式化
            </button>
            <button onClick={handleMinify} className="hover:bg-accent rounded px-3 py-1 text-sm transition-colors">
              压缩
            </button>
          </>
        )}

        {error && <span className="text-destructive ml-auto text-sm">错误: {error}</span>}
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'edit' ? (
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className={cn(
              'bg-background h-full w-full resize-none p-4 font-mono text-sm focus:outline-none',
              error && 'border-destructive border-l-4'
            )}
            placeholder="在此输入 JSON..."
          />
        ) : (
          <div className="bg-card h-full overflow-auto p-4">
            <JsonView
              value={parsedJson}
              style={{
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
              collapsed={2}
              displayDataTypes={false}
              enableClipboard
            />
          </div>
        )}
      </div>
    </div>
  );
};
