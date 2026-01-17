# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

Open-Context 是一个基于 Tauri 桌面应用构建的 RAG（检索增强生成）和上下文管理系统。它能够索引 Git 仓库，使用 AST 解析提取代码符号，构建依赖关系图，并支持语义和结构化代码搜索。该系统通过 MCP（模型上下文协议）对外提供服务，方便 AI 智能体集成。

## 架构设计

这是一个**混合桌面应用**，由三个主要组件构成：

### 1. Rust Tauri 后端 (src/)

- **桌面外壳**：管理应用窗口、插件和生命周期
- 入口点：`src/lib.rs` → `src/main.rs`
- 规划中的功能模块：
  - `app_sidecar.rs`：进程管理器，用于管理 Node.js 服务器、Qdrant 和 SurrealDB
  - `app_runtime.rs`：运行时依赖检查器（Node.js、Python、Go、Rust）
  - `app_state.rs`：全局应用状态管理
- 当前命令：`app_commands.rs` 中仅有最小的 `ping()` 用于 IPC 测试

### 2. Node.js 服务器 (packages/open-node) - RAG 引擎核心

- **核心索引和查询服务**，运行在 4500 端口
- 入口点：`packages/open-node/src/app.ts`
- 基于 Hono web 框架构建
- 当前仅支持 **TypeScript/JavaScript**（tree-sitter 集成）

**核心服务** (`src/services/`):

- **IndexerService**：编排仓库索引流程
- **GraphService**：内存中的双向依赖关系图（出边/入边）
  - 关系类型：IMPORTS, CALLS, IMPLEMENTS, EXTENDS, USES, REFERENCES
  - 使用 LevelDB 持久化存储
- **RAGService**：结合向量搜索和图遍历的查询引擎
- **VectorService**：封装 Qdrant，用于语义搜索和向量嵌入生成
- **JobService**：管理索引任务生命周期（queued → running → completed/failed）

**索引器** (`src/indexers/`):

- **SymbolExtractor**：使用 Tree-sitter 进行 AST 解析，提取函数、类、方法、接口
- **CodeChunkBuilder**：将符号转换为可搜索的代码块，附带嵌入文本
- **GraphBuilder**：从 AST 中提取依赖关系边（导入、调用）
- **ASTParser**：Tree-sitter 包装器，提供辅助方法

**存储层** (`src/db/`):

- **LevelDB** (`leveldb.ts`)：三个数据库（main、edges、reverse-edges），存储符号、元数据和双向图
- **Qdrant** (`qdrant-client.ts`)：向量数据库，使用 1024 维嵌入向量进行语义搜索

**任务队列** (`src/jobs/`):

- **JobQueue**：简单的内存顺序处理器（不支持并发任务）
- **IndexJob**：完整索引流程（解析 → 提取 → 嵌入 → 存储 → 构建图）
- **ReindexJob**：增量更新（git pull + 差量索引）

### 3. React 前端 (packages/open-web)

- **桌面应用前端界面**，在 Tauri 窗口中渲染，运行在 1420 端口（开发模式）
- 入口点：`packages/open-web/src/main.tsx` → `__root.tsx` → 各路由组件
- 技术栈：React 19、TypeScript、Vite、Tailwind CSS 4、shadcn/ui、Tiptap 编辑器

**路由架构** (`src/routes/`):

- **TanStack Router**：文件系统路由，自动生成 `routeTree.gen.ts`
- 根布局 (`__root.tsx`)：包裹 GlobalContextProvider 和 QueryProvider
- 路由页面：
  - `/` (`index.tsx`)：首页
  - `/chat` (`chat.tsx`)：聊天界面
  - `/search` (`search.tsx`)：搜索界面
  - `/settings` (`settings.tsx`)：设置页面

**状态管理** (`src/context/`, `src/zustand/`):

- **Zustand**：轻量级状态管理，用于用户状态 (`userStore`)
- **React Query**：服务端状态管理和数据缓存 (`QueryProvider`)
- **GlobalContext**：全局上下文（当前为空，待扩展）

**富文本编辑器组件** (`src/components/tiptap-*`):

完整的 Tiptap 编辑器集成，分为四个层次：

- **tiptap-extension**：自定义扩展（如背景色）
- **tiptap-node**：节点实现（Blockquote、CodeBlock、Heading、Image、ImageUpload、List、Paragraph、HorizontalRule）
- **tiptap-ui-primitive**：基础 UI 组件（Badge、Button、Card、Dropdown、Input、Popover、Separator、Spacer、Toolbar、Tooltip）
- **tiptap-ui**：功能按钮（Blockquote、CodeBlock、ColorHighlight、Heading、ImageUpload、Link、List、Mark、TextAlign、UndoRedo）
- **tiptap-templates**：编辑器模板（simple-editor）
- **tiptap-icons**：SVG 图标组件（36+ 个图标）

**UI 组件** (`src/components/ui/`):

基于 Radix UI 和 shadcn/ui 构建：

- AlertDialog、Alert、AspectRatio、Avatar、Badge、Breadcrumb、ButtonGroup、Button、Checkbox、Separator

**国际化** (`src/i18n/`):

- **i18next** + **react-i18next**
- 支持语言：简体中文（默认）、繁体中文、English、日本語、한국어
- 浏览器语言自动检测，使用 localStorage 持久化

**工具函数** (`src/lib/`):

- **utils.ts**：`cn()` 用于类名合并（clsx + tailwind-merge）
- **tiptap-utils.ts**：Tiptap 相关工具（图片上传、文件大小限制）

**自定义 Hooks** (`src/hooks/`):

- **use-tiptap-editor**：访问 Tiptap 编辑器实例
- **use-composed-ref**：组合多个 React refs
- **use-cursor-visibility**：光标可见性检测
- **use-element-rect**：元素尺寸追踪
- **use-is-breakpoint**：响应式断点检测
- **use-menu-navigation**：菜单键盘导航
- **use-scrolling**：滚动状态检测
- **use-throttled-callback**：节流回调
- **use-window-size**：窗口尺寸监听
- **use-unmount**：组件卸载时回调

**Tauri 集成** (`src/tauri/`):

- 当前为空占位符，计划集成 Tauri API 插件
- 已安装插件：autostart、clipboard、dialog、fs、global-shortcut、log、opener、os、positioner、shell、store、updater、window-state

## 常用命令

### 开发

```bash
# 启动所有组件（Tauri 应用 + Node.js 服务器）
pnpm dev

# 启动单个组件
pnpm dev:app       # Tauri 应用（无文件监听）
pnpm dev:web       # 仅 React 前端 (http://localhost:1420)
pnpm dev:server    # 仅 Node.js 服务器 (http://localhost:4500)
```

### 构建

```bash
# 构建所有组件（服务器 + 桌面应用）
pnpm build:all

# 构建单个组件
pnpm build:web     # 构建 React 前端
pnpm build:server  # 构建 Node.js 服务器
pnpm build:app     # 构建 Tauri 桌面应用

# 预览 web 构建
pnpm preview
```

### 测试（Node.js 服务器）

```bash
# 运行所有测试
pnpm --filter open-node test

# 单次运行测试（CI 模式）
pnpm --filter open-node test:run

# 监听模式
pnpm --filter open-node test:watch

# 生成覆盖率报告
pnpm --filter open-node test:coverage

# UI 模式
pnpm --filter open-node test:ui
```

### 代码检查与格式化

```bash
# 检查并自动修复所有代码
pnpm lint           # 运行 Rust 和 JavaScript 检查
pnpm lint:rs        # Cargo clippy 自动修复
pnpm lint:js        # oxlint TypeScript 类型感知检查

# 格式化所有代码
pnpm fmt            # 格式化 Rust 和 JavaScript
pnpm fmt:js         # Prettier
pnpm fmt:rs         # cargo fmt
```

### Tauri

```bash
# 直接访问 Tauri CLI
pnpm tauri <command>
```

## 核心数据流

### 索引流程

1. 用户触发：`POST /repos/:repoId/index`
2. JobService 创建任务 → JobQueue 入队
3. IndexJob 执行：
   - IndexerService → GitService 读取仓库文件
   - SymbolExtractor 解析 AST → 提取符号
   - CodeChunkBuilder → 生成代码块及嵌入文本
   - GraphBuilder → 构建依赖关系边
   - VectorService 生成嵌入向量
   - 将向量存入 Qdrant，符号/边存入 LevelDB
   - GraphService 将边加载到内存
4. 任务状态更新：0% → 30% → 60% → 80% → 100%

### 查询流程

1. 用户查询：`POST /query/code` 或 `POST /query/vector`
2. RAGService：
   - VectorService 生成查询嵌入向量
   - Qdrant 搜索返回 top-K 相似符号
   - 可选：GraphService 扩展结果，包含依赖关系
   - 返回包含关系上下文的丰富结果

## 存储架构

- **LevelDB**：元数据、符号和图结构（持久化 K-V 存储）
  - 三个独立数据库：main、edges、reverse-edges
  - 支持快速双向图遍历
- **Qdrant**：向量嵌入（针对相似度搜索优化）
  - 集合：`code_symbols`，可配置维度
  - 索引字段：workspace_id、repo_id、symbol_kind、exported、language
- **GraphService**：内存中的双向邻接表（启动时从 LevelDB 加载）

## 重要说明

### 当前限制

- **语言支持**：仅实现了 TypeScript/JavaScript 索引
  - 已有 Bash、CSS、HTML、JSON 的 Tree-sitter 解析器但未集成
  - `symbol-extractor.ts` 中的符号提取需要扩展以支持新语言
- **Rust 后端**：主要是脚手架 - Tauri 与 Node.js 的 IPC 未完全实现
- **前端**：UI 框架已搭建，但业务功能尚未与 Node.js 服务器集成
  - 富文本编辑器组件已完整实现
  - 路由、状态管理、国际化基础设施已就绪
  - 缺少与后端 RAG 服务的 API 集成
- **任务队列**：简单的内存队列（已导入 BullMQ 但未使用）

### 开发模式

- **Monorepo**：使用 pnpm workspaces 和过滤器（`--filter open-node` 或 `--filter open-web`）
- **符号 ID**：格式为 `${workspaceId}/${repoId}/${filePath}#${qualifiedName}`
- **图边存储**：格式为 `${fromSymbol}:${edgeType}` → `[toSymbols...]`
- **重要性评分**：符号按 exported + public + has docComment 排序
- **路径别名**：前端使用 `@/` 指向 `packages/open-web/src/`
- **样式方案**：Tailwind CSS + SCSS 模块混合使用，Tiptap 组件使用 SCSS
- **类型安全**：TanStack Router 提供类型安全的路由导航

### 前端开发实践

**组件开发**：

- UI 组件基于 Radix UI primitives 和 shadcn/ui 模式
- 使用 `cn()` 工具函数合并 Tailwind 类名
- Tiptap 编辑器组件遵循分层架构：extension → node → ui-primitive → ui → templates
- 每个组件目录使用 `index.tsx` 作为导出入口

**样式规范**：

- 优先使用 Tailwind CSS 原子类
- 复杂组件样式使用 SCSS 模块（特别是 Tiptap 相关组件）
- 主题变量定义在 `src/styles/_variables.scss`
- 动画定义在 `src/styles/_keyframe-animations.scss`

**状态管理策略**：

- 使用 Zustand 管理客户端全局状态（如用户信息）
- 使用 React Query 管理服务端状态和数据缓存
- 组件本地状态使用 React Hooks

**路由约定**：

- 使用文件系统路由，`src/routes/` 下的文件自动生成路由
- `__root.tsx` 为根布局，包裹全局 Provider
- 路由组件通过 `createFileRoute` 或 `createRootRoute` 创建

**国际化工作流**：

- 翻译文件位于 `src/i18n/locales/`
- 使用 `useTranslation` Hook 访问翻译函数
- 默认语言为简体中文（zh-CN）

### 添加语言支持

要为索引器添加新语言支持：

1. 安装 tree-sitter 解析器包
2. 在 `SymbolExtractor.extractSymbols()` 中扩展特定语言的 AST 查询
3. 更新 `ASTParser` 以识别新语言
4. 在 `GraphBuilder` 中添加特定语言的节点类型映射

## 配置文件

- `tauri.conf.json`：Tauri 应用配置（窗口、打包、更新）
- `Cargo.toml`：Rust 依赖和构建配置
- `packages/open-node/esbuild.mjs`：Node.js 构建配置
- `packages/open-web/vite.config.ts`：Vite/React 构建配置
- `.oxlintrc.json`：JavaScript/TypeScript 检查规则
- `.prettierrc`：代码格式化规则

## API 端点（Node.js 服务器）

主要路由定义在 `packages/open-node/src/api/router.ts`：

- `/workspaces/*` - 工作空间 CRUD 操作
- `/repos/*` - 仓库管理
- `/repos/:repoId/index` - 触发索引任务
- `/query/vector` - 基于文本查询的语义搜索
- `/query/code` - 结合向量和图的代码搜索
- `/graph/*` - 依赖关系图查询
