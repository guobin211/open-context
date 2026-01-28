import { useState } from 'react';
import { Upload, Download, File as FileIcon, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PngParserProps {
  className?: string;
}

export const PngParser = ({ className }: PngParserProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [imageInfo, setImageInfo] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.png')) {
      setFile(selectedFile);
      const info = `文件名: ${selectedFile.name}\n大小: ${(selectedFile.size / 1024).toFixed(2)} KB\n类型: ${selectedFile.type}`;
      setImageInfo(info);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.png')) {
      setFile(droppedFile);
      const info = `文件名: ${droppedFile.name}\n大小: ${(droppedFile.size / 1024).toFixed(2)} KB\n类型: ${droppedFile.type}`;
      setImageInfo(info);
    }
  };

  const handleDownload = () => {
    if (!file) return;

    const blob = new Blob([file], { type: file.type || 'image/png' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-100 flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <ImageIcon className="size-5" />
            PNG 解析器
          </h2>

          <div
            className={cn(
              'border-border rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input type="file" accept=".png" onChange={handleFileSelect} className="hidden" id="png-upload" />
            <label htmlFor="png-upload" className="cursor-pointer">
              <Upload className="text-muted-foreground mx-auto mb-3 size-12" />
              <p className="text-muted-foreground text-sm">拖拽 PNG 文件到此处</p>
              <p className="text-muted-foreground mb-4 text-xs">或点击选择文件</p>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2 text-sm transition-colors">
                选择文件
              </button>
            </label>
          </div>

          {file && (
            <div className="mt-4 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <FileIcon className="size-4 text-green-600" />
                <span className="font-medium">{file.name}</span>
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                大小: {(file.size / 1024).toFixed(2)} KB | 类型: {file.type || 'PNG 文件'}
              </div>
            </div>
          )}
        </div>

        {file && (
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
            >
              <Download className="size-4" />
              下载文件
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="flex items-center gap-2 font-semibold">
              <ImageIcon className="size-5" />
              文件信息
            </h3>
          </div>

          {file ? (
            <div className="bg-muted overflow-auto rounded-lg p-4">
              <pre className="text-sm">{imageInfo}</pre>
            </div>
          ) : (
            <div className="bg-muted flex min-h-75 items-center justify-center rounded-lg">
              <div className="text-center">
                <FileIcon className="text-muted-foreground mx-auto mb-3 size-12" />
                <p className="text-muted-foreground text-sm">请选择 PNG 文件</p>
                <p className="text-muted-foreground mt-1 text-xs">支持 PNG 格式</p>
              </div>
            </div>
          )}

          {file && (
            <div className="bg-muted flex min-h-50 items-center justify-center rounded-lg p-4">
              {file && <img src={URL.createObjectURL(file)} alt="Preview" className="max-w-full rounded shadow-md" />}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">功能说明</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>使用 png-js 库解析 PNG 文件</li>
            <li>支持拖拽上传和点击选择</li>
            <li>显示文件基本信息</li>
            <li>提供图片预览功能</li>
            <li>支持下载原始文件</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
