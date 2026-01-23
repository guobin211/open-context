# AGENTS.md

本文件为在此仓库工作的 AI 编码代理提供指导。

## 项目架构概述

本项目是一个多模块协同的桌面应用，主要分为 3 个代码模块：

### 核心模块

| 模块                                  | 职责                                        | 技术栈                  |
| ------------------------------------- | ------------------------------------------- | ----------------------- |
| **tauri** (根目录 `src/`)             | 客户端桌面应用的壳，负责桌面相关的 API 操作 | Rust + Tauri            |
| **open-node** (`packages/open-node/`) | 后台服务，负责构建索引、文件处理等后台任务  | Node.js + Hono          |
| **open-web** (`packages/open-web/`)   | React 编写的 Web 端 UI，提供用户界面        | React + TanStack Router |

### 交互流程

```
用户操作
    ↓
┌─────────────┐
│  open-web   │  用户在 Web UI 上点击操作
│  (前端)     │
└──────┬──────┘
       │ HTTP/WebSocket
       ↓
┌─────────────┐
│   tauri     │  调用 Tauri 命令完成本地笔记创建
│  (桌面壳)   │  和文件导入等 FS 类操作
└──────┬──────┘
       │ 启动服务
       ↓
┌─────────────┐
│  open-node  │  启动 Node.js 后台服务
│  (后台服务) │
└──────┬──────┘
       │ 返回服务地址 + Auth 权限
       ↓
┌─────────────┐
│  open-web   │  Web 端接收服务地址和权限
└──────┬──────┘
       │ HTTP/WebSocket 交互
       ↓
┌─────────────┐
│  open-node  │  Web 端与后台服务进行交互
│  (后台服务) │  - HTTP: REST API 调用
│             │  - WebSocket: 实时通信
└─────────────┘
       ↑
       │ HTTP/WebSocket 交互
       │
┌─────────────┐
│   tauri     │  Rust 端也与 Node 端进行交互
│  (桌面壳)   │
└─────────────┘
```

**流程说明**：

1. **用户在 Web UI 上操作**：用户通过 React 前端（open-web）进行交互，点击创建笔记、导入文件等操作
2. **Tauri 命令调用**：前端通过 Tauri 桥接调用 Rust 端命令，完成本地文件系统操作（FS 操作）
3. **启动后台服务**：Rust 端负责启动 Node.js 后台服务（open-node）
4. **返回服务凭证**：Rust 端将后台服务的地址和认证权限返回给 Web 端
5. **Web 端与后台交互**：Web 端通过 HTTP REST API 和 WebSocket 与 Node.js 后台服务进行交互
6. **Rust 端与后台交互**：Rust 端也通过 HTTP 和 WebSocket 与 Node.js 后端服务进行交互

### 模块通信总结

| 通信方向             | 协议           | 主要用途                |
| -------------------- | -------------- | ----------------------- |
| open-web → tauri     | Tauri IPC      | 本地 FS 操作、系统调用  |
| tauri → open-node    | IPC 启动命令   | 启动/停止后台服务       |
| open-web → open-node | HTTP/WebSocket | REST API 调用、实时通信 |
| tauri → open-node    | HTTP/WebSocket | 服务管理、状态同步      |

## 命令

### 构建与开发

```bash
# 启动所有组件 (Tauri 应用 + Node.js 服务)
pnpm dev

# 启动单个组件
pnpm dev:web        # React 前端 (http://localhost:1420)
pnpm dev:server     # Node.js 服务 (http://localhost:4500)
pnpm dev:app        # Tauri 应用 (无文件监听)

# 构建组件
pnpm build:all      # 构建服务 + 应用
pnpm build:web      # 构建 React 前端
pnpm build:server   # 构建 Node.js 服务
pnpm build:app      # 构建 Tauri 桌面应用
```

### 代码检查与格式化

```bash
# 检查并修复所有代码
pnpm lint           # 运行 Rust (clippy) 和 JavaScript (oxlint) 检查
pnpm lint:rs       ` # Cargo clippy 自动修复
pnpm lint:js        # Oxlint TypeScript 感知检查器自动修复

# 格式化所有代码
pnpm fmt            # 格式化 Rust (cargo fmt) 和 JavaScript (prettier)
pnpm fmt:js         # Prettier
pnpm fmt:rs         # Cargo fmt
```

### 测试

```bash
# 运行所有测试 (Node.js 服务)
pnpm --filter open-node test

# 运行一次测试 (CI 模式)
pnpm --filter open-node test:run

# 监听模式运行测试
pnpm --filter open-node test:watch

# 生成覆盖率报告
pnpm --filter open-node test:coverage

# 运行单个测试文件
pnpm --filter open-node test workspace-service.test.ts

# 使用 UI 运行测试
pnpm --filter open-node test:ui
```

## 代码风格指南

### TypeScript/JavaScript (packages/open-node, packages/open-web)

**导入规范:**

- open-node 使用相对导入: `import { SymbolExtractor } from '../indexers'`
- open-web 使用绝对导入: `import { cn } from '@/lib/utils'` (指向 `packages/open-web/src/`)
- 顺序: 外部库 → 内部模块
- 类型导入: 优先混合使用，仅在复杂类型回环依赖时使用 `import type`

**命名规范:**

- 类/接口/类型: PascalCase (`WorkspaceService`, `CreateWorkspaceDto`)
- 函数/方法: camelCase (`createWorkspace`, `getRepoPath`)
- 变量/常量: camelCase (`repoPath`, `currentCommit`)
- React 组件: PascalCase (`Button`, `RootLayout`)
- Hooks: use- 前缀 (`useTiptapEditor`, `useWindowSize`)
- 测试文件: `*.test.ts` 后缀
- 服务文件: kebab-case 带有 `-service.ts` 后缀 (`workspace-service.ts`)
- 组件文件: PascalCase (`Button.tsx`, `index.tsx` 作为桶导出)

**类型安全:**

- 始终返回类型化 Promise: `Promise<Workspace | null>`
- 公开方法显式返回类型，内部方法允许推断
- 禁止 `any` 类型 (oxlint 阻止)
- 禁止类型错误抑制 (`@ts-ignore`, `as any` 禁止)

**错误处理:**

- 使用结构化日志: `logger.info({ id }, 'Deleting workspace')`
- 自然传播错误 (最少 try/catch)
- 服务方法返回 `null` 表示未找到
- 当前无自定义错误类 (避免过度设计)

**React 组件模式:**

- **组件声明**: 允许使用两种形式
  - 箭头函数: `export const Button = ({ className, ...props }: ButtonProps) =>`
  - function 声明: `export function Button() { ... }`
  - shadcn/ui 组件使用 function 声明，业务组件推荐使用箭头函数
- Props 接口命名为 `{组件名}Props` (`ButtonProps`)
- 使用 `cn()` 工具合并 Tailwind 类 (来自 `@/lib/utils`)
- 使用 `...props` 解构以保持向前兼容
- 使用 Radix UI 原语 + shadcn/ui 模式
- Tiptap 组件: 分层架构 (extension → node → ui-primitive → ui → templates)
- 使用 `forwardRef` 的组件: `export const Button = forwardRef<HTMLButtonElement, ButtonProps>(...)`
- 使用 `memo` 的组件: `export const Icon = memo(({ ... }: Props) => ...)`

**路由模式:**

- 使用 TanStack Router 文件系统路由 (位于 `src/routes/`)
- 路由导出: `export const Route = createFileRoute('/')({ component: RouteComponent })`
- 根路由: `__root.tsx`，使用 `createRootRoute` 和 `Outlet`
- 类型安全导航和参数访问

**状态管理:**

- **Zustand**: 客户端全局状态 (位于 `src/storage/`，如 `workspace-store.ts`, `document-store.ts`, `sidebar-store.ts`)
- **React Query**: 服务端状态和缓存 (通过 `QueryProvider` 提供)
- **Local state**: 组件特定状态

**国际化:**

- 使用 i18next 和 react-i18next
- 语言文件位于 `src/i18n/locales/` (zh-CN, en, ja, ko, zh-TW)
- 支持自动语言检测和手动切换

**测试模式:**

- open 当前无测试配置 (测试仅在 open-node 中)

### Rust (src/)

**`命名规范:**

- 模块: snake_case (`mod app_commands`)
- 函数: snake_case (`pub fn run()`)
- 类型/结构体: PascalCase (遵循 Rust 约定)
- 私有成员: 无前缀 (使用 `pub` 控制可见性)

**错误处理:**

- 使用 `Result<T, E>` 类型
- 使用 `?` 操作符传播错误
- 谨慎使用 `.expect()` (优先使用 `?` 或优雅解包)

## 架构模式

### Node.js 服务 (packages/open-node)

**分层架构:**

```
api/          → REST 端点 (Hono 路由)
services/     → 业务逻辑
db/           → 数据访问 (LevelDB, Qdrant, SurrealDB)
indexers/     → 代码解析 (tree-sitter)
jobs/         → 异步任务 (BullMQ)
utils/        → 工具 (git, fs, logger, vector)
types/        → TypeScript 定义
```

**服务模式:**

```typescript
export class WorkspaceService {
  private repo = new WorkspaceRepository();

  async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    logger.info({ name: dto.name }, 'Creating workspace');
    const workspace = await this.repo.create(dto);
    logger.info({ id: workspace.id }, 'Workspace created');
    return workspace;
  }
}
```

**文件组织:**

- 每个目录桶导出 (`index.ts`)
- 类型与实现共置 (`types/` 目录)
- 测试文件镜像 `src/` 结构到 `tests/`

### React 前端 (packages/open-web)

**路由 (TanStack Router):**

- 文件系统路由在 `src/routes/`
- `__root.tsx` 是带 Providers 的根布局
- 使用 `createFileRoute` 或 `createRootRoute`
- 类型安全导航和参数访问

**组件结构:**

```
src/
├── components/
│   ├── ui/              # shadcn/ui 组件 (通过 index.tsx 桶导出)
│   ├── tiptap-*/        # 富文本编辑器层级 (extension, icons, node, ui, ui-primitive, templates)
│   ├── layout/          # 布局组件
│   └── sidebar/         # 侧边栏组件
├── routes/              # 文件系统路由
├── context/             # Context Providers (global-context, query-provider)
├── storage/             # Zustand stores (workspace-store, document-store, sidebar-store 等)
├── hooks/               # 自定义 hooks (use- 前缀)
├── services/            # 服务层 (http-services, tauri-services)
├── lib/                 # 工具 (cn(), utils.ts)
└── i18n/                # 国际化 (locales/ 目录包含 zh-CN, en, ja ko, zh-TW)
```

**样式:**

- Tailwind CSS 4 (优先原子类)
- 复杂组件使用 SCSS 模块 (Tiptap)
- `cn()` 用于合并类 (来自 `@/lib/utils`)
- 响应式断点: 使用 Tailwind 工具类

## 重要约束

### 禁止模式

- **禁止类型错误抑制**: 永远不要使用 `as any`, `@ts-ignore`, `@ts-expect-error`
- **禁止空 catch 块**: 所有错误必须处理或重新抛出
- **禁止直接样式编辑**: 前端视觉变更委托给 `frontend-ui-ux-engineer` 代理
- **禁止删除失败的测试**: 修复根本原因, 不要删除测试
- **禁止 function 声明**: React 组件必须使用箭头函数 `export const Component = () =>`，不要使用 `function Component() {}`

### 语言支持

- **当前实现**: 仅 TypeScript/JavaScript (tree-sitter 集成)
- **计划中**: Bash, CSS, HTML, JSON 解析器已安装但未集成

### Monorepo 使用

- 使用 `pnpm --filter <package>` 在特定包中运行命令
- 包: `open-node`, `open-web`, `tauri-app` (根目录)

## 配置文件

- `.oxlintrc.json`: TypeScript/JavaScript 代码检查规则
- `.prettierrc`: 代码格式化 (120 字符宽度, 单引号, LF)
- `Cargo.toml`: Rust 依赖
- `packages/open-node/package.json`: Node.js 服务依赖
- `packages/open-web/package.json`: 前端依赖
- `tauri.conf.json`: Tauri 应用配置
- `packages/open-node/vitest.config.ts`: Vitest 测试配置

## 技术文档参考

### 核心系统文档

- **持久化存储规范**: `docs/APP_CONFIG_USAGE.md` - 数据存储路径规范、配置管理
- **事件系统**: `docs/APP_EVENT_SYSTEM.md` - 前后端通信机制、事件类型
- **Tauri 命令**: `docs/APP_TAURI_COMMANDS.md` - IPC 命令参考、数据类型
- **配色方案**: `docs/APP_COLOR_PALETTE.md` - UI` 颜色主题、CSS 变量

### 子项目文档

- **Node.js 后端**: `packages/open-node/README.md` - RAG 引擎、代码索引、向量检索
- **React 前端**: `packages/open-web/README.md` - UI 组件、路由、状态管理

### 数据存储

- 所有数据存储在 `~/.open-context/` 目录
- 详见 `docs/APP_CONFIG_USAGE.md` 中的完整目录结构
