# File Preview 组件使用文档

## 概述

FilePreview 是一个通用的文件预览组件,支持多种文件类型的预览,包括文本、图片、PDF、视频和音频等。

## 功能特性

- ✅ **多文件类型支持**: 文本、图片、PDF、视频、音频
- ✅ **自动类型推断**: 根据文件扩展名自动选择预览方式
- ✅ **错误处理**: 支持自定义错误回调
- ✅ **可复用设计**: 通过 props 配置,支持多场景复用

## 快速开始

### 基础使用

```tsx
import { FilePreview, inferFileType } from '@/components/file-preview';

const MyComponent = () => {
  const filePath = '/path/to/image.png';
  const fileType = inferFileType(filePath);

  return <FilePreview filePath={filePath} fileType={fileType} />;
};
```

### 预览文本文件

```tsx
import { FilePreview } from '@/components/file-preview';

<FilePreview filePath="/path/to/file.txt" fileType="text" content="文件内容..." />;
```

### 预览图片

```tsx
import { FilePreview } from '@/components/file-preview';

<FilePreview filePath="/path/to/image.png" fileType="image" onError={(error) => console.error('加载失败:', error)} />;
```

## API 参考

### FilePreview Props

| 属性      | 类型                                                            | 默认值      | 描述               |
| --------- | --------------------------------------------------------------- | ----------- | ------------------ |
| filePath  | `string`                                                        | 必需        | 文件路径           |
| fileType  | `'text' \| 'image' \| 'pdf' \| 'video' \| 'audio' \| 'unknown'` | `'unknown'` | 文件类型           |
| content   | `string`                                                        | -           | 文本内容(文本类型) |
| className | `string`                                                        | -           | 自定义样式类名     |
| onError   | `(error: Error) => void`                                        | -           | 错误回调           |

### 工具函数

#### inferFileType

根据文件扩展名推断文件类型。

```typescript
function inferFileType(filePath: string): FilePreviewProps['fileType'];
```

**支持的文件扩展名**：

- **图片**: jpg, jpeg, png, gif, bmp, svg, webp
- **视频**: mp4, webm, ogg, mov, avi
- **音频**: mp3, wav, ogg, flac, m4a
- **PDF**: pdf
- **文本**: txt, log, csv, xml, json, yaml, yml, toml, ini

## 使用示例

### 完整的文件预览器

```tsx
import { useState } from 'react';
import { FilePreview, inferFileType } from '@/components/file-preview';

export const FileViewer = () => {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = (path: string) => {
    setSelectedFile(path);
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 border-r">{/* 文件列表 */}</div>

      <div className="flex-1">
        {selectedFile && <FilePreview filePath={selectedFile} fileType={inferFileType(selectedFile)} />}
      </div>
    </div>
  );
};
```

### 集成错误处理

```tsx
import { FilePreview, inferFileType } from '@/components/file-preview';
import { toast } from 'sonner';

<FilePreview
  filePath={filePath}
  fileType={inferFileType(filePath)}
  onError={(error) => {
    toast.error('文件加载失败', {
      description: error.message
    });
  }}
/>;
```

## 扩展开发

如需支持更多文件类型,可以在 `file-preview.tsx` 中添加新的预览组件:

```tsx
case 'markdown':
  return <MarkdownPreview content={content || ''} />;
```

同时更新 `inferFileType` 函数添加新的扩展名映射。

## 相关组件

- **file-tree**: VSCode 风格的文件树组件
- **file-editor**: 支持多种编辑模式的文件编辑器
- **file-manager**: 文件管理器组件(待实现)
