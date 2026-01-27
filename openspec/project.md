# 项目 上下文

## 目的

Open-Context 是一款开源的 AI Agent 上下文管理工具，提供对话、笔记、文件、工作空间一体化的协作环境，帮助 AI Agent 更好地理解和利用上下文信息。项目采用混合桌面应用架构，结合 Rust 的系统级能力、Node.js 的后端服务能力和 React 的现代化前端，为用户提供 VS Code 风格的协作体验。

## 技术栈

### 前端（open-web）

- **框架**: React 19 + TypeScript
- **路由**: TanStack Router (文件系统路由)
- **状态管理**: Zust Zustand (客户端全局状态) + React (Query 服务端状态)
- **UI 组件**: Radix UI 原语 + shadcn/ui
- **样式**: Tailwind CSS 4 + SCSS 模块
- **富文本编辑**: Tiptap (分层架构)
- **国际化**: i18next + react-i18next

### 后端服务（open-node）

- **运行时**: Node.js 18.0.0+
- **Web 框架**: Hono
- **数据库**:
  - LevelDB (符号、依赖关系)
  - SurrealDB (图数据库)
  - Qdrant (向量数据库，需独立部署)
- **索引引擎**: tree-sitter (TypeScript/JavaScript 解析)
- **任务队列**: BullMQ
- **日志**: pino

### 桌面应用（open-app）

- **框架**: Rust + Tauri 2.x
- **错误处理**: anyhow + thiserror
- **本地数据**: SQLite

### 开发工具

- **包管理**: pnpm 9.0.0+
- **代码检查**: oxlint (TypeScript/JavaScript) + clippy (Rust)
- **格式化**: Prettier + cargo fmt
- **测试**: Vitest (open-node)
- **版本控制**: Git

## 项目约定

### 代码风格

#### TypeScript/JavaScript (open-node, open-web)

- **文件命名**: kebab-case (`nav-item.tsx`, `workspace-service.ts`)
- **标识符命名**:
  - 类/接口/类型: PascalCase (`WorkspaceService`, `NavItemProps`)
  - 函数/方法/变量: camelCase (`createWorkspace`)
  - React Hooks: `use` 前缀 (`useSidebarStore`)
- **组件模式**: 严格使用箭头函数，禁止 function 声明
  ```tsx
  // 正确
  export const Button = ({ className, ...props }: ButtonProps) => { ... }
  // 错误
  export function Button() { ... }
  ```
- **Props 接口**: `{组件名}Props` (`ButtonProps`)
- **导入规范**:
  - open-node: 相对导入 (`import { X } from '../utils'`)
  - open-web: 绝对导入 (`import { cn } from '@/lib/utils'`)
  - 顺序: 外部库 → 内部模块
- **注释规范**:
  - 不使用行尾注释，注释单独成行
  - 函数使用 Doc 注释，不标注参数类型
- **文件行数**: TypeScript 文件不超过 1000 行，超出需拆分

#### Rust (open-app)

- **文件命名**: snake_case (`app_commands.rs`)
- **标识符命名**:
  - 模块/函数/变量: snake_case
  - 类型/结构体/枚举: PascalCase
  - 常量: SCREAMING_SNAKE_CASE
- **代码风格**: 缩进 4 空格
- **注释规范**: `//!` 模块文档，`///` 函数文档

### 架构模式

#### 分层架构（open-node）

```
api/          → REST 端点 (Hono 路由)
services/     → 业务逻辑
db/           → 数据访问 (LevelDB, Qdrant, SurrealDB)
indexers/     → 代码解析 (tree-sitter)
jobs/         → 异步任务 (BullMQ)
utils/        → 工具 (git, fs, logger, vector)
types/        → TypeScript 定义
```

#### 服务模式

- 每个目录包含 `index.ts` 作为桶导出
- 类型与实现共置 (`types/` 目录)
- 测试文件镜像 `src/` 结构到 `tests/`

#### 前端目录结构

```
src/
├── components/
│   ├── ui/              # shadcn/ui 组件
│   ├── ti layout/          # 布局组件
│   └── sidebar/         # 侧边栏组件
├── routes/              # TanStack Router 文件系统路由
├── zustand/             # Zustand stores
├── hooks/               # 自定义 hooks
├── lib/                 # 工具函数
└── i18n/                # 国际化 (zh-CN, en, ja, ko, zh-TW)
```

#### 通信机制

- **open-web → tauri**: Tauri IPC (本地 FS 操作、系统调用)
- **tauri → open-node**: IPC 启动命令 (启动/停止后台服务)
- **open-web → open-node**: HTTP/WebSocket (REST API 调用、实时通信)
- **tauri → open-node**: HTTP/WebSocket (服务管理、状态同步)

### 测试策略

#### 测试范围

- **当前实现**: 仅在 open-node 中配置测试 (Vitest)
- **open-web**: 当前无测试配置
- **open-app**: 当前无测试配置

#### 测试命令

```bash
pnpm --filter open-node test           # 运行所有测试
pnpm --filter open-node test:run       # CI 模式
pnpm --filter open-node test:watch     # 监听模式
pnpm --filter open-node test:ui        # UI 模式
pnpm --filter open-node test:coverage  # 覆盖率报告
```

#### 测试文件

- 后缀: `*.test.ts`
- 镜像 `src/` 结构到 `tests/`

### Git 工作流

#### 分支策略

- **主分支**: `main` (稳定发布)
- **开发分支**: `develop` (日常开发)
- **功能分支**: `feature/xxx` (新功能)
- **修复分支**: `fix/xxx` (bug 修复)
- **重构分支**: `refactor/xxx` (代码重构)

#### 提交约定

- 遵循 Conventional Commits 规范
- 不自动提交，等待用户明确指示
- 不使用 `--force`、`--amend` (除非用户要求)

#### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

- type: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
- scope: 影响的模块 (open-web, open-node, open-app)

## 领域上下文

### 数据存储

- 所有数据存储在 `~/.open-context/` 目录
- **SQLite**: `~/.open-context/database/sqlite.app.db` (Tauri 端)
- **SurrealDB**: `~/.open-context/database/surrealdb/` (图数据库)
- **LevelDB**: `~/.open-context/database/leveldb/` (符号、依赖关系)
- **Qdrant**: 向量数据库 (需独立部署)

### 核心功能

- **对话管理**: 多会话、消息历史、智能上下文追踪
- **笔记系统**: 多类型笔记 (富文本、Markdown)、收藏、分类
- **文件管理**: 本地文件夹浏览、文件预览、最近文件
- **工作空间**: Git 仓库管理、文档组织、资源聚合
- **全局搜索**: 快速搜索、命令面板 (⌘P)、智能联想
- **多标签页**: 对话、笔记、文件多标签管理

### 语言支持

- **当前实现**: 仅 TypeScript/JavaScript (tree-sitter 集成)
- **计划中**: Bash, CSS, HTML, JSON 解析器已安装但未集成

## 重要约束

### 技术约束

- **类型安全**: 禁止 `any` 类型、`@ts-ignore`、`@ts-expect-error`、`as any`
- **错误处理**: 禁止空 catch 块，必须处理或重新抛出错误
- **测试**: 禁止删除失败的测试，必须修复根本原因
- **Rust**: 禁止 `.unwrap()` 用于可能失败的操作，使用 `.expect("说明")`

### 业务约束

- **Monorepo**: 使用 `pnpm --filter <package>` 在特定包中运行命令
- **包**: `open-node`, `open-web`, `open-app`

### 代码质量

- **代码检查**: `pnpm lint` (Rust clippy + JavaScript oxlint)
- **格式化**: `pnpm fmt` (cargo fmt + Prettier)
- **类型检查**: `pnpm --filter open-node type-check`

## 外部依赖

### 关键外部服务

- **Qdrant**: 向量数据库 (需独立部署)
- **SurrealDB**: 图数据库
- **LevelDB**: 键值存储

### 核心 API 库

- **Tauri 2.x**: 桌面应用框架
- **Hono**: Node.js Web 框架
- **TanStack Router**: 文件系统路由
- **Radix UI**: UI 组件原语
- **tree-sitter**: 代码解析
- **BullMQ**: 任务队列
- **pino**: 结构化日志
- **anyhow**: Rust 错误处理
- **thiserror**: Rust 库错误处理

### 开发依赖

- **pnpm**: 包管理器
- **oxlint**: TypeScript/JavaScript 检查
- **clippy**: Rust 检查
- **Prettier**: 代码格式化
- **Vitest**: 测试框架
- **Git**: 版本控制
