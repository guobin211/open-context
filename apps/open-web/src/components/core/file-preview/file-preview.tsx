import { memo } from 'react';
import { File } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilePreviewProps {
  filePath: string;
  fileType?: 'text' | 'image' | 'pdf' | 'video' | 'audio' | 'unknown';
  content?: string;
  className?: string;
  onError?: (error: Error) => void;
}

/**
 * 文件预览组件,支持多种文件类型的预览
 */
export const FilePreview = memo(({ filePath, fileType = 'unknown', content, className, onError }: FilePreviewProps) => {
  const renderPreview = () => {
    switch (fileType) {
      case 'text':
        return <TextPreview content={content || ''} />;
      case 'image':
        return <ImagePreview src={filePath} onError={onError} />;
      case 'pdf':
        return <PDFPreview src={filePath} onError={onError} />;
      case 'video':
        return <VideoPreview src={filePath} onError={onError} />;
      case 'audio':
        return <AudioPreview src={filePath} onError={onError} />;
      default:
        return <UnsupportedPreview fileName={filePath} />;
    }
  };

  return <div className={cn('h-full w-full overflow-auto', className)}>{renderPreview()}</div>;
});

FilePreview.displayName = 'FilePreview';

interface TextPreviewProps {
  content: string;
}

const TextPreview = memo(({ content }: TextPreviewProps) => {
  return (
    <div className="p-4">
      <pre className="font-mono text-sm wrap-break-word whitespace-pre-wrap text-gray-700">{content}</pre>
    </div>
  );
});

TextPreview.displayName = 'TextPreview';

interface ImagePreviewProps {
  src: string;
  onError?: (error: Error) => void;
}

const ImagePreview = memo(({ src, onError }: ImagePreviewProps) => {
  const handleError = () => {
    onError?.(new Error(`Failed to load image: ${src}`));
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-4">
      <img src={src} alt="Preview" className="max-h-full max-w-full object-contain" onError={handleError} />
    </div>
  );
});

ImagePreview.displayName = 'ImagePreview';

interface PDFPreviewProps {
  src: string;
  onError?: (error: Error) => void;
}

const PDFPreview = memo(({ src }: PDFPreviewProps) => {
  return (
    <div className="h-full w-full">
      <iframe src={src} className="h-full w-full border-0" title="PDF Preview" />
    </div>
  );
});

PDFPreview.displayName = 'PDFPreview';

interface VideoPreviewProps {
  src: string;
  onError?: (error: Error) => void;
}

const VideoPreview = memo(({ src, onError }: VideoPreviewProps) => {
  const handleError = () => {
    onError?.(new Error(`Failed to load video: ${src}`));
  };

  return (
    <div className="flex h-full items-center justify-center bg-gray-900 p-4">
      <video controls className="max-h-full max-w-full" onError={handleError}>
        <source src={src} />
        Your browser does not support video playback.
      </video>
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';

interface AudioPreviewProps {
  src: string;
  onError?: (error: Error) => void;
}

const AudioPreview = memo(({ src, onError }: AudioPreviewProps) => {
  const handleError = () => {
    onError?.(new Error(`Failed to load audio: ${src}`));
  };

  return (
    <div className="flex h-full items-center justify-center p-4">
      <audio controls className="w-full max-w-md" onError={handleError}>
        <source src={src} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
});

AudioPreview.displayName = 'AudioPreview';

interface UnsupportedPreviewProps {
  fileName: string;
}

const UnsupportedPreview = memo(({ fileName }: UnsupportedPreviewProps) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
      <File className="h-16 w-16" />
      <p className="text-sm">无法预览此文件类型</p>
      <p className="text-xs text-gray-400">{fileName}</p>
    </div>
  );
});

UnsupportedPreview.displayName = 'UnsupportedPreview';

/**
 * 根据文件扩展名推断文件类型
 */
export function inferFileType(filePath: string): FilePreviewProps['fileType'] {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'm4a'];
  const textExts = ['txt', 'log', 'csv', 'xml', 'json', 'yaml', 'yml', 'toml', 'ini'];

  if (!ext) return 'unknown';

  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (textExts.includes(ext)) return 'text';

  return 'unknown';
}
