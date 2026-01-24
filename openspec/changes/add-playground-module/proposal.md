# 变更：添加 Playground 路由模块

## 为什么

需要一个统一的开发测试环境来验证和展示各种编辑器、查看器和工具组件，方便开发者快速预览、调试新功能，并为未来功能集成提供组件原型。

## 变更内容

- 创建 `/playground` 路由模块，包含 16 个子页面
- 实现以下编辑器组件：
  - Markdown 编辑器 + 预览
  - 代码编辑器（Monaco Editor）
  - 富文本编辑器（复用现有 Tiptap）
  - JSON 编辑器 + 预览
- 实现以下查看器组件：
  - 文件树（VS Code 风格，复用现有组件）
  - 文件管理器（Spacedrive 风格，网格 + 预览）
  - PDF 查看器
  - Excel 查看器
  - Word 查看器
- 实现以下工具组件：
  - 终端模拟器（xterm.js）
  - 聊天界面
  - 网页浏览器（Tauri WebviewWindow）
  - AST 可视化查看器
  - 图片编辑和压缩工具
  - 数据可视化（AntV G2/X6）
  - 工作流编辑器（React Flow）
- 添加统一的 Playground 左右分栏布局（左侧导航 + 右侧内容，均支持 Y 轴滚动）

## 影响

- **受影响规范**：`playground`（新增功能）
- **受影响代码**：
  - `apps/open-web/src/routes/playground/*` - 16 个路由页面
  - `apps/open-web/src/components/playground/*` - 组件实现
  - `apps/open-web/package.json` - 新增 11 个依赖包
- **包体积影响**：预计增加 ~3-5 MB（gzipped），需代码分割和懒加载
- **性能考虑**：所有编辑器组件必须按需加载，避免阻塞主线程
