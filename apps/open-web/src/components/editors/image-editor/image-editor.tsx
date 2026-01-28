import { useState, useRef } from 'react';
import { Upload, Download, RotateCw } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';

interface ImageEditorProps {
  className?: string;
}

export const ImageEditor = ({ className }: ImageEditorProps) => {
  const [image, setImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [quality, setQuality] = useState<number>(0.8);
  const [rotation, setRotation] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalSize(file.size);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setCompressedImage(null);
        setRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompress = async () => {
    if (!image) return;

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        quality: quality
      };

      const compressedFile = await imageCompression(file, options);
      setCompressedSize(compressedFile.size);

      const reader = new FileReader();
      reader.onload = (event) => {
        setCompressedImage(event.target?.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('压缩失败:', error);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const imageToDownload = compressedImage || image;
    if (!imageToDownload) return;

    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `edited-image-${Date.now()}.jpg`;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const displayImage = compressedImage || image;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-4 flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors"
        >
          <Upload className="size-4" />
          上传图片
        </button>

        {image && (
          <>
            <button
              onClick={handleRotate}
              className="border-border hover:bg-accent flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors"
            >
              <RotateCw className="size-4" />
              旋转
            </button>

            <button
              onClick={handleDownload}
              className="border-border hover:bg-accent flex items-center gap-2 rounded border px-3 py-2 text-sm transition-colors"
            >
              <Download className="size-4" />
              下载
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-muted-foreground text-sm">压缩质量：</label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-32"
              />
              <span className="text-sm">{Math.round(quality * 100)}%</span>
              <button
                onClick={handleCompress}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-2 text-sm transition-colors"
              >
                压缩
              </button>
            </div>
          </>
        )}
      </div>

      {displayImage ? (
        <>
          <div className="border-border bg-card flex-1 overflow-auto rounded-lg border p-4">
            <div className="flex h-full items-center justify-center">
              <img
                src={displayImage}
                alt="Preview"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                className="transition-transform"
              />
            </div>
          </div>

          <div className="border-border bg-card mt-4 grid grid-cols-3 gap-4 rounded-lg border p-4">
            <div>
              <span className="text-muted-foreground text-sm">原始大小</span>
              <p className="text-sm font-medium">{formatSize(originalSize)}</p>
            </div>
            {compressedSize > 0 && (
              <>
                <div>
                  <span className="text-muted-foreground text-sm">压缩后大小</span>
                  <p className="text-sm font-medium">{formatSize(compressedSize)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">压缩率</span>
                  <p className="text-sm font-medium">{((1 - compressedSize / originalSize) * 100).toFixed(1)}%</p>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="border-border flex flex-1 items-center justify-center rounded-lg border-2 border-dashed">
          <div className="text-center">
            <Upload className="text-muted-foreground mx-auto mb-2 size-12" />
            <p className="text-muted-foreground text-sm">点击上传图片进行编辑和压缩</p>
          </div>
        </div>
      )}
    </div>
  );
};
