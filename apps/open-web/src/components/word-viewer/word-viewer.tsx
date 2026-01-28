import { useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordViewerProps {
  className?: string;
}

export const WordViewer = ({ className }: WordViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && containerRef.current) {
      setFileName(file.name);
      setLoading(true);
      containerRef.current.innerHTML = '';

      try {
        await renderAsync(file, containerRef.current, undefined, {
          className: 'docx-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true
        });
      } catch (error) {
        console.error('Word 文档渲染失败:', error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="flex h-full items-center justify-center">
              <p class="text-sm text-destructive">文档加载失败，请确保文件格式正确</p>
            </div>
          `;
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-4 flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors"
        >
          <Upload className="size-4" />
          上传 Word 文档
        </button>
        {fileName && <span className="text-muted-foreground text-sm">当前文件: {fileName}</span>}
      </div>

      {loading ? (
        <div className="border-border bg-card flex flex-1 items-center justify-center rounded-lg border">
          <span className="text-muted-foreground text-sm">正在加载文档...</span>
        </div>
      ) : (
        <div
          ref={containerRef}
          className={cn(
            'border-border flex-1 overflow-auto rounded-lg border bg-white p-8',
            !fileName && 'flex items-center justify-center border-2 border-dashed'
          )}
        >
          {!fileName && (
            <div className="text-center">
              <Upload className="text-muted-foreground mx-auto mb-2 size-12" />
              <p className="text-muted-foreground text-sm">点击上传 .docx 文件进行查看</p>
              <p className="text-muted-foreground mt-1 text-xs">支持 Microsoft Word 2007+ 格式</p>
            </div>
          )}
        </div>
      )}

      <style>
        {`
          .docx-wrapper {
            background: white;
            padding: 20px;
            min-height: 100%;
          }
          .docx-wrapper section.docx {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin: 0 auto 20px;
            padding: 20px;
            max-width: 800px;
          }
        `}
      </style>
    </div>
  );
};
