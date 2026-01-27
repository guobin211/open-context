import { memo, useState, useCallback } from 'react';
import { MonacoEditor, inferMonacoLanguage } from './monaco-editor';
import { TiptapEditor } from './tiptap-editor';
import { MarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';

export type FileEditorMode = 'code' | 'richtext' | 'markdown' | 'markdown-preview';

export interface FileEditorProps {
  filePath?: string;
  content?: string;
  mode?: FileEditorMode;
  readOnly?: boolean;
  className?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

/**
 * 文件编辑器组件,支持代码编辑、富文本编辑和 Markdown 编辑
 */
export const FileEditor = memo(
  ({ filePath, content = '', mode: initialMode, readOnly = false, className, onChange, onSave }: FileEditorProps) => {
    const [mode] = useState<FileEditorMode>(() => {
      if (initialMode) return initialMode;
      return inferEditorMode(filePath || '');
    });

    const [isPreview, setIsPreview] = useState(false);

    const handleTogglePreview = useCallback(() => {
      setIsPreview((prev) => !prev);
    }, []);

    const renderEditor = () => {
      if (mode === 'markdown') {
        if (isPreview) {
          return <MarkdownRenderer content={content} className="h-full overflow-auto" />;
        }

        return (
          <div className="flex h-full flex-col">
            <div className="border-b bg-gray-50 px-4 py-2">
              <button
                onClick={handleTogglePreview}
                className="rounded px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
              >
                {isPreview ? '编辑' : '预览'}
              </button>
            </div>
            <div className="flex-1">
              <MonacoEditor
                value={content}
                language="plaintext"
                readOnly={readOnly}
                onChange={onChange}
                onSave={onSave}
              />
            </div>
          </div>
        );
      }

      if (mode === 'markdown-preview') {
        return <MarkdownRenderer content={content} className="h-full overflow-auto" />;
      }

      if (mode === 'richtext') {
        return <TiptapEditor content={content} editable={!readOnly} onChange={onChange} onSave={onSave} />;
      }

      const language = filePath ? inferMonacoLanguage(filePath) : 'plaintext';
      return (
        <MonacoEditor value={content} language={language} readOnly={readOnly} onChange={onChange} onSave={onSave} />
      );
    };

    return <div className={cn('h-full w-full', className)}>{renderEditor()}</div>;
  }
);

FileEditor.displayName = 'FileEditor';

/**
 * 根据文件路径推断编辑器模式
 */
export function inferEditorMode(filePath: string): FileEditorMode {
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'md' || ext === 'markdown') {
    return 'markdown';
  }

  if (ext === 'html' || ext === 'htm') {
    return 'richtext';
  }

  return 'code';
}
