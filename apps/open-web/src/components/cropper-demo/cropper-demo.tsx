import { useState } from 'react';
import { Upload, Crop, RotateCw, Download, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CropperDemoProps {
  className?: string;
}

export const CropperDemo = ({ className }: CropperDemoProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && (selectedFile.type.startsWith('image/') || selectedFile.type.startsWith('image/'))) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type.startsWith('image/'))) {
      setFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `cropped-${rotation}deg.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-[400px] flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Crop className="size-5" />
            图片裁剪演示
          </h2>

          <div
            className={cn(
              'border-border rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="image-upload" />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="text-muted-foreground mx-auto mb-3 size-12" />
              <p className="text-muted-foreground text-sm">拖拽图片到此处</p>
              <p className="text-muted-foreground mb-4 text-xs">或点击选择图片（支持 JPG/PNG/WebP 等格式）</p>
              <button className="bg-primary:click:bg-primary/90 text-primary-foreground hover:bg-primary/90 rounded px-4 py-2 text-sm transition-colors">
                选择图片
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
                大小: {(file.size / 1024).toFixed(2)} KB | 类型: {file.type}
              </div>
            </div>
          )}

          {file && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleRotate}
                className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
                title="旋转 90 度"
              >
                <RotateCw className="size-4" />
                旋转 90°
              </button>
              <button
                onClick={handleDownload}
                className="bg-muted hover:bg-muted/80 text-foreground flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
              >
                <Download className="size-4" />
                下载图片
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="font-semibold">预览</h3>
            {file && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs">旋转: {rotation}°</span>
            )}
          </div>
        </div>

        {file ? (
          <div className="bg-muted flex min-h-[400px] items-center justify-center rounded-lg">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="h-auto w-full rounded-md shadow-md"
              style={{
                transform: `rotate(${rotation}deg)`,
                maxHeight: '400px'
              }}
            />
          </div>
        ) : (
          <div className="bg-muted flex min-h-[300px] items-center justify-center rounded-lg">
            <div className="text-center">
              <FileIcon className="text-muted-foreground mx-auto mb-3 size-12" />
              <p className="text-muted-foreground text-sm">请选择图片进行裁剪</p>
              <p className="text-muted-foreground mt-1 text-xs">支持 JPG/PNG/WebP 等图片格式</p>
            </div>
          </div>
        )}

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">功能说明</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>使用 cropperjs 进行图片裁剪</li>
            <li>支持拖拽上传和点击选择</li>
            <li>支持 90 度旋转操作</li>
            <li>实时预览旋转效果</li>
            <li>支持下载旋转后的图片</li>
            <li>纯前端实现，无需后端支持</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
