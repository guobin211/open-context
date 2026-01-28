# File Editor 组件使用文档

## 概述

FileEditor 是一个多功能的文件编辑器组件,集成了 Monaco Editor(代码编辑)、Tiptap(富文本编辑)和 Markdown-it(Markdown 渲染)三种编辑模式,支持通过 props 配置实现可复用设计。

## 功能特性

- ✅ **Monaco Editor**: 专业代码编辑器,支持语法高亮、自动补全、多语言支持
- ✅ **Tiptap Editor**: 现代富文本编辑器,支持图片、链接、高亮等
- ✅ **Markdown 编辑与预览**: 支持实时预览、GitHub Alerts、表格等扩展
- ✅ **自动模式推断**: 根据文件扩展名自动选择编辑模式
- ✅ **保存快捷键**: 支持 Cmd/Ctrl+S 保存
- ✅ **可复用设计**: 通过 props 传入配置,适用多种场景

## 快速开始

### 基础使用

```tsx
import { FileEditor, inferEditorMode } from '@/components/file-editor';

const MyComponent = () => {
  const filePath = '/path/to/file.ts';
  const mode = inferEditorMode(filePath);

  return (
    <FileEditor
      filePath={filePath}
      mode={mode}
      content="console.log('Hello World');"
      onChange={(content) => console.log('Content changed:', content)}
      onSave={(content) => console.log('Save:', content)}
    />
  );
};
```

### 代码编辑器模式

```tsx
import { MonacoEditor } from '@/components/file-editor';

<MonacoEditor
  value="const x = 42;"
  language="typescript"
  theme="vs-dark"
  onChange={(value) => console.log(value)}
  onSave={(value) => saveFile(value)}
/>;
```

### 富文本编辑器模式

```tsx
import { TiptapEditor } from '@/components/file-editor';

<TiptapEditor
  content="<p>Hello <strong>World</strong></p>"
  editable={true}
  onChange={(html) => console.log(html)}
  onSave={(html) => saveFile(html)}
/>;
```

### Markdown 编辑器模式

```tsx
import { FileEditor } from '@/components/file-editor';

<FileEditor mode="markdown" content="# Hello\n\nThis is **markdown**." onChange={(content) => console.log(content)} />;
```

### Markdown 预览模式

```tsx
import { MarkdownRenderer } from '@/components/file-editor';

<MarkdownRenderer content="# Title\n\n- Item 1\n- Item 2" />;
```

## API 参考

### FileEditor Props

| 属性      | 类型                                                       | 默认值   | 描述                       |
| --------- | ---------------------------------------------------------- | -------- | -------------------------- |
| filePath  | `string`                                                   | -        | 文件路径(用于自动推断模式) |
| content   | `string`                                                   | `''`     | 编辑器内容                 |
| mode      | `'code' \| 'richtext' \| 'markdown' \| 'markdown-preview'` | 自动推断 | 编辑器模式                 |
| readOnly  | `boolean`                                                  | `false`  | 只读模式                   |
| className | `string`                                                   | -        | 自定义样式类名             |
| onChange  | `(content: string) => void`                                | -        | 内容变化回调               |
| onSave    | `(content: string) => void`                                | -        | 保存回调(Cmd/Ctrl+S)       |

### MonacoEditor Props

| 属性      | 类型                              | 默认值        | 描述                 |
| --------- | --------------------------------- | ------------- | -------------------- |
| value     | `string`                          | `''`          | 编辑器内容           |
| language  | `MonacoEditorLanguage`            | `'plaintext'` | 编程语言             |
| readOnly  | `boolean`                         | `false`       | 只读模式             |
| theme     | `'vs' \| 'vs-dark' \| 'hc-black'` | `'vs'`        | 编辑器主题           |
| className | `string`                          | -             | 自定义样式类名       |
| onChange  | `(value: string) => void`         | -             | 内容变化回调         |
| onSave    | `(value: string) => void`         | -             | 保存回调(Cmd/Ctrl+S) |

**MonacoEditorLanguage 支持的语言**:

- javascript, typescript, python, java, cpp, csharp, go, rust
- html, css, json, xml, yaml, sql, shell, plaintext

### TiptapEditor Props

| 属性      | 类型                        | 默认值 | 描述                 |
| --------- | --------------------------- | ------ | -------------------- |
| content   | `string`                    | `''`   | HTML 内容            |
| editable  | `boolean`                   | `true` | 可编辑状态           |
| className | `string`                    | -      | 自定义样式类名       |
| onChange  | `(content: string) => void` | -      | 内容变化回调         |
| onSave    | `(content: string) => void` | -      | 保存回调(Cmd/Ctrl+S) |

### MarkdownRenderer Props

| 属性      | 类型     | 默认值 | 描述           |
| --------- | -------- | ------ | -------------- |
| content   | `string` | 必需   | Markdown 内容  |
| className | `string` | -      | 自定义样式类名 |

## 工具函数

### inferEditorMode

根据文件路径推断编辑器模式。

```typescript
function inferEditorMode(filePath: string): FileEditorMode;
```

**推断规则**:

- `.md`, `.markdown` → `'markdown'`
- `.html`, `.htm` → `'richtext'`
- 其他 → `'code'`

### inferMonacoLanguage

根据文件扩展名推断 Monaco Editor 语言。

```typescript
function inferMonacoLanguage(filePath: string): MonacoEditorLanguage;
```

## 使用示例

### 完整的文件编辑器

```tsx
import { useState } from 'react';
import { FileEditor, inferEditorMode } from '@/components/file-editor';
import { toast } from 'sonner';

export const FileEditorApp = ({ filePath }: { filePath: string }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (newContent: string) => {
    setIsSaving(true);
    try {
      await saveFileToServer(filePath, newContent);
      toast.success('保存成功');
    } catch (error) {
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <FileEditor
      filePath={filePath}
      content={content}
      mode={inferEditorMode(filePath)}
      onChange={setContent}
      onSave={handleSave}
    />
  );
};
```

### 代码对比器

```tsx
import { MonacoEditor } from '@/components/file-editor';

export const CodeDiff = () => {
  return (
    <div className="grid h-screen grid-cols-2 gap-4">
      <MonacoEditor value={oldCode} language="typescript" readOnly />
      <MonacoEditor value={newCode} language="typescript" />
    </div>
  );
};
```

### Markdown 编辑器带预览

```tsx
import { useState } from 'react';
import { MonacoEditor, MarkdownRenderer } from '@/components/file-editor';

export const MarkdownEditor = () => {
  const [markdown, setMarkdown] = useState('# Hello\n\nWorld');
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <MonacoEditor value={markdown} language="plaintext" onChange={setMarkdown} />
      </div>
      {showPreview && (
        <div className="flex-1 border-l">
          <MarkdownRenderer content={markdown} />
        </div>
      )}
    </div>
  );
};
```

## Markdown 扩展功能

MarkdownRenderer 支持以下扩展:

- ✅ **GitHub Alerts**: 提示框(note, warning, tip 等)
- ✅ **表格增强**: 支持合并单元格、多行表格
- ✅ **Emoji**: `:smile:` → 😄
- ✅ **上下标**: H~2~O, x^2^
- ✅ **标记**: ==highlight==
- ✅ **缩写**: 自动展开缩写

## 键盘快捷键

- **Cmd/Ctrl + S**: 保存文件
- **Monaco Editor**: 支持所有 VSCode 快捷键
- **Tiptap Editor**: 支持常见富文本快捷键(Cmd+B 加粗等)

## 相关组件

- **file-tree**: VSCode 风格的文件树组件
- **file-preview**: 多种文件类型预览组件
- **file-manager**: 文件管理器组件(待实现)

## 扩展开发

### 添加新的编程语言支持

在 `monaco-editor.tsx` 的 `languageMap` 中添加映射:

```typescript
const languageMap: Record<string, MonacoEditorLanguage> = {
  // 现有映射...
  kt: 'kotlin',
  swift: 'swift'
};
```

### 自定义 Tiptap 扩展

在 `tiptap-editor.tsx` 的 `extensions` 中添加:

```typescript
import CustomExtension from '@tiptap/extension-custom';

extensions: [
  // 现有扩展...
  CustomExtension.configure({
    /* 配置 */
  })
];
```

### 添加 Markdown 插件

在 `markdown-renderer.tsx` 中引入并使用:

```typescript
import MarkdownItPlugin from 'markdown-it-plugin';

.use(MarkdownItPlugin, { /* 配置 */ })
```
