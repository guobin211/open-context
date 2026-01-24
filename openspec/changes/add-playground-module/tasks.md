## 1. 基础设施

- [x] 1.1 创建 `routes/playground/` 目录结构
- [x] 1.2 实现 `PlaygroundLayout` 左右分栏布局组件
- [x] 1.3 实现 `PlaygroundSidebar` 左侧导航栏（240px 固定宽度，Y 轴滚动）
- [x] 1.4 实现 `PlaygroundContent` 右侧内容区（flex-1，Y 轴滚动）
- [x] 1.5 实现 `PlaygroundHeader` 标题栏组件（48px）
- [x] 1.6 实现 `PlaygroundMain` 主体内容组件
- [x] 1.7 实现 `PlaygroundToolbar` 工具栏组件（40px，可选）
- [x] 1.8 创建 `routes/playground/index.tsx` 入口页面
- [x] 1.9 配置路由懒加载策略（使用 `lazyRouteComponent`）

## 2. 高优先级组件（核心功能）

### 2.1 Markdown 编辑器

- [x] 2.1.1 安装 `react-markdown` 和 `remark-gfm`
- [x] 2.1.2 实现 `MarkdownEditor` 组件
- [x] 2.1.3 实现 `MarkdownPreview` 组件（支持 GFM 语法）
- [x] 2.1.4 创建 `routes/playground/markdown.tsx`
- [x] 2.1.5 添加分屏预览功能

### 2.2 代码编辑器

- [x] 2.2.1 安装 `@monaco-editor/react`
- [x] 2.2.2 实现 `MonacoEditor` 组件（支持多语言）
- [x] 2.2.3 创建 `routes/playground/code-editor.tsx`
- [x] 2.2.4 配置语法高亮和自动补全
- [x] 2.2.5 添加主题切换功能

### 2.3 富文本编辑器

- [x] 2.3.1 复用现有 Tiptap 编辑器组件
- [x] 2.3.2 创建 `routes/playground/rich-text.tsx`
- [x] 2.3.3 添加工具栏快捷操作

### 2.4 JSON 编辑器

- [x] 2.4.1 安装 `@uiw/react-json-view`
- [x] 2.4.2 实现 `JsonEditor` 组件（可编辑）
- [x] 2.4.3 实现 `JsonViewer` 组件（只读折叠树）
- [x] 2.4.4 创建 `routes/playground/json-editor.tsx`
- [x] 2.4.5 添加格式验证和错误提示

## 3. 中优先级组件（常用工具）

### 3.1 文件树

- [x] 3.1.1 复用现有 `components/file-tree` 组件
- [x] 3.1.2 创建 `routes/playground/file-tree.tsx`
- [x] 3.1.3 添加演示数据和交互示例

### 3.2 文件管理器

- [x] 3.2.1 安装 `@tanstack/react-virtual`
- [x] 3.2.2 实现 `FileGrid` 组件（虚拟滚动网格）
- [x] 3.2.3 实现 `FilePreview` 组件（支持图片/文本）
- [x] 3.2.4 实现 `ImagePreview` 组件（缩略图）
- [x] 3.2.5 创建 `routes/playground/file-manager.tsx`
- [x] 3.2.6 添加文件选择和多选功能

### 3.3 终端模拟器

- [x] 3.3.1 安装 `@xterm/xterm` 和相关 addon
- [x] 3.3.2 实现 `XtermTerminal` 组件
- [x] 3.3.3 创建 `routes/playground/terminal.tsx`
- [x] 3.3.4 配置终端主题和字体
- [x] 3.3.5 添加模拟命令执行功能

### 3.4 PDF 查看器

- [x] 3.4.1 安装 `react-pdf`
- [x] 3.4.2 实现 `PdfCanvas` 组件（分页渲染）
- [x] 3.4.3 创建 `routes/playground/pdf-viewer.tsx`
- [x] 3.4.4 添加缩放和翻页控制

## 4. 低优先级组件（扩展功能）

### 4.1 网页浏览器

- [x] 4.1.1 实现 `WebBrowser` 组件（Tauri WebviewWindow）
- [x] 4.1.2 创建 `routes/playground/webview.tsx`
- [x] 4.1.3 添加地址栏和导航控制

### 4.2 聊天界面

- [x] 4.2.1 实现 `ChatMessage` 组件（消息气泡）
- [x] 4.2.2 实现 `ChatInput` 组件（输入框）
- [x] 4.2.3 创建 `routes/playground/chat.tsx`
- [x] 4.2.4 添加消息滚动和时间戳

### 4.3 AST 查看器

- [x] 4.3.1 安装 `@xyflow/react` 和 `tree-sitter-wasms`
- [x] 4.3.2 实现 `AstTree` 组件（可视化语法树）
- [x] 4.3.3 创建 `routes/playground/ast-viewer.tsx`
- [x] 4.3.4 添加代码解析和树形展示

### 4.4 图片编辑器

- [x] 4.4.1 安装 `cropperjs` 和 `browser-image-compression`
- [x] 4.4.2 实现 `ImageCanvas` 组件（裁剪、滤镜）
- [x] 4.4.3 实现 `ImageCompressor` 组件（压缩）
- [x] 4.4.4 创建 `routes/playground/image-editor.tsx`
- [x] 4.4.5 添加 `@jsquash/*` 图像转换支持

### 4.5 Excel 查看器

- [x] 4.5.1 安装 `@fortune-sheet/react`
- [x] 4.5.2 实现 `ExcelGrid` 组件
- [x] 4.5.3 创建 `routes/playground/excel-viewer.tsx`

### 4.6 Word 查看器

- [x] 4.6.1 安装 `docx-preview`
- [x] 4.6.2 实现 `WordPreview` 组件
- [x] 4.6.3 创建 `routes/playground/word-viewer.tsx`

### 4.7 数据可视化

- [x] 4.7.1 安装 `@antv/g2` 和 `@antv/s2`
- [x] 4.7.2 实现 `AntvCharts` 组件（图表示例）
- [x] 4.7.3 创建 `routes/playground/data-viz.tsx`
- [x] 4.7.4 添加 3-5 种常用图表类型

### 4.8 工作流编辑器

- [x] 4.8.1 安装 `@xyflow/react`
- [x] 4.8.2 实现 `WorkflowCanvas` 组件（拖拽画布）
- [x] 4.8.3 实现 `WorkflowNode` 组件（节点类型）
- [x] 4.8.4 创建 `routes/playground/workflow-editor.tsx`
- [x] 4.8.5 添加节点连接和删除功能

## 5. 扩展功能组件（额外实现）

### 5.1 Diff 查看器

- [x] 5.1.1 安装 `diff`
- [x] 5.1.2 创建 `routes/playground/diff-viewer.tsx`
- [x] 5.1.3 实现文本差异对比功能

### 5.2 Excel 转 JSON

- [x] 5.2.1 创建 `routes/playground/excel-to-json.tsx`
- [x] 5.2.2 复用 `@fortune-sheet/react` 实现 Excel 解析
- [x] 5.2.3 实现 JSON 导出功能

### 5.3 PNG 解析器

- [x] 5.3.1 安装 `png-js`
- [x] 5.3.2 创建 `routes/playground/png-parser.tsx`
- [x] 5.3.3 实现 PNG 文件信息解析

### 5.4 裁剪演示

- [x] 5.4.1 创建 `routes/playground/cropper-demo.tsx`
- [x] 5.4.2 复用 `cropperjs` 实现裁剪功能

### 5.5 二维码生成器

- [x] 5.5.1 安装 `qrcode`
- [x] 5.5.2 创建 `routes/playground/qrcode-generator.tsx`
- [x] 5.5.3 实现二维码生成和下载

### 5.6 OCR 查看器

- [x] 5.6.1 安装 `tesseract.js`
- [x] 5.6.2 创建 `routes/playground/ocr-viewer.tsx`
- [x] 5.6.3 实现图片文字识别

### 5.7 虚拟列表

- [x] 5.7.1 创建 `routes/playground/virtual-list.tsx`
- [x] 5.7.2 复用 `@tanstack/react-virtual` 实现虚拟列表

### 5.8 KaTeX 数学公式

- [x] 5.8.1 安装 `katex`
- [x] 5.8.2 创建 `routes/playground/katex-math.tsx`
- [x] 5.8.3 实现数学公式渲染

### 5.9 快捷键演示

- [x] 5.9.1 安装 `react-hotkeys-hook`
- [x] 5.9.2 创建 `routes/playground/hotkeys-demo.tsx`
- [x] 5.9.3 实现快捷键绑定和提示

### 5.10 XML 解析器

- [x] 5.10.1 安装 `fast-xml-parser`
- [x] 5.10.2 创建 `routes/playground/xml-parser.tsx`
- [x] 5.10.3 实现 XML 解析和格式化

### 5.11 拖放上传

- [x] 5.11.1 安装 `@dnd-kit/*`
- [x] 5.11.2 创建 `routes/playground/drag-and-drop.tsx`
- [x] 5.11.3 实现拖放上传功能

### 5.12 COS 上传

- [x] 5.12.1 安装 `cos-js-sdk-v5` 和 `ali-oss`
- [x] 5.12.2 创建 `routes/playground/cos-upload.tsx`
- [x] 5.12.3 实现云存储上传功能

## 6. 集成与优化

- [x] 6.1 配置 Vite 代码分割策略（每个编辑器独立 chunk）
- [x] 6.2 添加暗色模式适配（所有组件）
- [ ] 6.3 添加国际化支持（`i18n/locales/*/playground.json`）
- [ ] 6.4 实现错误边界组件（组件加载失败处理）
- [ ] 6.5 添加加载状态和骨架屏
- [ ] 6.6 性能测试和优化（Lighthouse 评分 > 90）

## 7. 测试与验证

- [ ] 7.1 手动测试所有组件功能
- [ ] 7.2 验证暗色模式切换
- [ ] 7.3 验证国际化文本
- [ ] 7.4 测试代码分割效果（bundle 大小）
- [ ] 7.5 测试组件懒加载性能
