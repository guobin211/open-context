import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  initialValue?: string;
  className?: string;
}

export const MarkdownEditor = ({
  initialValue = '# Hello Markdown\n\n开始编辑你的 Markdown 文档...',
  className
}: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialValue);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-border flex items-center gap-2 border-b p-2">
        <button
          onClick={() => setViewMode('split')}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            viewMode === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          分屏
        </button>
        <button
          onClick={() => setViewMode('edit')}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            viewMode === 'edit' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          仅编辑
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={cn(
            'rounded px-3 py-1 text-sm transition-colors',
            viewMode === 'preview' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          仅预览
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className={cn('border-border flex flex-col border-r', viewMode === 'split' ? 'w-1/2' : 'w-full')}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-background h-full resize-none p-4 font-mono text-sm focus:outline-none"
              placeholder="在此输入 Markdown..."
            />
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={cn('bg-card overflow-y-auto p-4', viewMode === 'split' ? 'w-1/2' : 'w-full')}>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
