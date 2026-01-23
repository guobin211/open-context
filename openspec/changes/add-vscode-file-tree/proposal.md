# 变更:实现 VS Code 风格的文件树组件

## 为什么

当前系统缺少高性能的文件管理器功能,无法有效浏览和管理工作空间中的文件。需要实现类似 VS Code 的文件树组件,提供按需加载、虚拟列表渲染、实时文件监听等核心能力,支持 10 万+ 文件目录的流畅交互。

## 变更内容

- 实现 Rust 后端的文件系统操作 API(按需读取目录、文件监听、CRUD 操作)
- 实现前端虚拟列表渲染组件,基于 @tanstack/react-virtual
- 添加文件树交互功能(展开/折叠、右键菜单、重命名、删除)
- 实现双层缓存机制(Rust + 前端)提升性能
- 添加文件系统监听,支持实时更新
- 实现文件搜索功能
- 支持路径导航面包屑

## 影响

- 受影响规范:file-explorer(新增功能)
- 受影响代码:
  - Rust: `src/app_commands.rs`(新增文件操作命令)
  - Node.js: 无影响
  - React: `packages/open-web/src/components/file-tree/`(新增组件)
  - React: `packages/open-web/src/hooks/use-file-tree.ts`(新增 Hook)
