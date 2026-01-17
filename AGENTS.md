# AGENTS.md

本文件为在此仓库工作的 AI 编码代理提供指导。

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
pnpm lint:rs        # Cargo clippy 自动修复
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

- 同包内使用相对导入: `import { SymbolExtractor } from '../indexers'`
- 前端使用绝对导入: `import { cn } from '@/lib/utils'` (指向 `packages/open-web/src/`)
- 顺序: 外部库 → 内部模块
- 类型导入与值导入混合使用 (无需显式 `import type`)

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
- 公开方法显式返回类型, 内部允许推断
- 禁止 `any` 类型 (oxlint 阻止)
- 禁止类型错误抑制 (`@ts-ignore`, `as any` 禁止)

**错误处理:**

- 使用结构化日志: `logger.info({ id }, 'Deleting workspace')`
- 自然传播错误 (最少 try/catch)
- 服务方法返回 `null` 表示未找到
- 当前无自定义错误类 (避免过度设计)

**React 组件模式:**

- Props 接口命名为 `{组件名}Props` (`ButtonProps`)
- 使用 `cn()` 工具合并 Tailwind 类 (来自 `@/lib/utils`)
- 使用 `...props` 解构以保持向前兼容
- 使用 Radix UI 原语 + shadcn/ui 模式
- Tiptap 组件: 分层架构 (extension → node → ui-primitive → ui → templates)

**状态管理:**

- **Zustand**: 客户端全局状态 (如 `userStore`)
- **React Query**: 服务端状态和缓存
- **Local state**: 组件特定状态

### Rust (src/)

**命名规范:**

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
db/           → 数据访问 (LevelDB, Qdrant)
indexers/     → 代码解析 (tree-sitter)
jobs/         → 异步任务
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
- 类型安全导航

**组件结构:**

```
src/
├── components/
│   ├── ui/              # shadcn/ui 组件 (通过 index.tsx 桶导出)
│   └── tiptap-*/        # 富文本编辑器层级
├── routes/              # 文件系统路由
├── context/             # Context Providers
├── zustand/             # Zustand stores
├── hooks/               # 自定义 hooks (use- 前缀)
├── lib/                 # 工具 (cn(), utils.ts)
└── i18n/                # 国际化
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
