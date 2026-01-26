<!-- OPENSPEC:START -->

# OpenSpec 使用说明

这些说明适用于在此项目中工作的AI助手。

## 语言偏好设置

**默认使用中文**：除非明确说明使用英文，否则所有输出都应使用中文，包括：

- 文档内容
- 代码注释
- 提交信息
- 规范说明

## 工作流程

当请求满足以下条件时，始终打开`@/openspec/AGENTS.md`：

- 提及规划或提案（如提案、规范、变更、计划等词语）
- 引入新功能、重大变更、架构变更或大型性能/安全工作时
- 听起来不明确，需要在编码前了解权威规范时

使用`@/openspec/AGENTS.md`了解：

- 如何创建和应用变更提案
- 规范格式和约定
- 项目结构和指南

保持此托管块，以便'openspec-cn update'可以刷新说明。

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Open-Context 是一个开源的 AI Agent 上下文管理工具，提供对话、笔记、文件、工作空间一体化的协作环境。

**核心功能**：

- 💬 对话管理 - 多会话对话、消息历史记录、智能上下文追踪
- 📝 笔记系统 - 多类型笔记支持（富文本、Markdown）、笔记收藏、分类管理
- 📁 文件管理 - 本地文件夹浏览、文件预览、最近文件记录
- 🗂️ 工作空间 - Git 仓库管理、文档组织、资源聚合
- 🔍 RAG 检索 - 向量检索（Qdrant）+ 依赖关系图
- 🔄 事件系统 - 完整的前后端通信机制
- 🌐 MCP 协议支持 - 对外提供标准化服务接口

**技术架构**：Tauri (Rust) + Node.js RAG 引擎 + React 前端

**UI 特点**：VS Code 风格三栏布局，多标签页管理，现代化交互

详细介绍请参考 [README.md](./README.md)。

## 目录结构规范

```
open-context/
├── apps/                           # 应用模块
│   ├── open-app/                   # Tauri 桌面应用（Rust 后端）
│   │   └── src/
│   │       ├── main.rs             # 应用入口
│   │       ├── lib.rs              # 库导出
│   │       ├── app_command/        # Tauri IPC 命令
│   │       │   ├── mod.rs          # 命令注册器
│   │       │   ├── dto.rs          # 数据传输对象
│   │       │   ├── system_commands.rs       # 系统命令
│   │       │   ├── workspace_commands.rs    # 工作空间命令
│   │       │   ├── file_commands.rs         # 文件命令
│   │       │   ├── file_tree_commands.rs    # 文件树命令
│   │       │   ├── note_commands.rs         # 笔记命令
│   │       │   ├── repository_commands.rs   # 仓库命令
│   │       │   └── task_commands.rs         # 任务命令
│   │       ├── app_state/         # 状态管理与数据模型
│   │       │   ├── database.rs    # SQLite 数据库管理器
│   │       │   ├── state.rs       # 应用状态结构
│   │       │   ├── app_config.rs  # 配置管理
│   │       │   ├── app_state_workspace.rs    # 工作空间状态
│   │       │   ├── app_state_note.rs         # 笔记状态
│   │       │   ├── app_state_file.rs         # 文件状态
│   │       │   ├── app_state_folder.rs       # 文件夹状态
│   │       │   ├── app_state_repo.rs         # 仓库状态
│   │       │   ├── app_state_chat.rs         # 对话状态
│   │       │   ├── app_state_link.rs         # 链接状态
│   │       │   ├── app_state_terminal.rs     # 终端状态
│   │       │   ├── app_state_webview.rs      # WebView 状态
│   │       │   └── app_state_task.rs         # 任务状态
│   │       ├── app_events/        # 事件系统
│   │       │   ├── event_type.rs  # 事件类型定义（30+ 种事件）
│   │       │   └── event_emitter.rs  # 事件发射器
│   │       └── app_service/        # 业务服务
│   │           ├── app_file_tree.rs     # 文件树管理
│   │           ├── app_runtime.rs       # 运行时配置
│   │           ├── app_sidecar.rs       # Sidecar 进程管理
│   │           └── app_task.rs          # 任务调度
│   │
│   ├── open-web/                   # React 前端
│   │   └── src/
│   │       ├── components/        # UI 组件
│   │       │   ├── ui/            # shadcn/ui 基础组件
│   │       │   ├── layout/        # 布局组件（三栏布局）
│   │       │   ├── sidebar/       # 侧边栏组件（树形结构）
│   │       │   ├── file-tree/     # 文件树组件
│   │       │   └── tiptap-*/      # Tiptap 编辑器相关组件
│   │       ├── routes/            # TanStack Router 路由
│   │       │   ├── __root.tsx     # 根布局
│   │       │   ├── index.tsx      # 首页
│   │       │   ├── playground/    # Playground 路由（30+ 个子页面）
│   │       │   └── settings/      # 设置页面路由
│   │       ├── storage/           # Zustand 状态管理
│   │       │   ├── chat-store.ts
│   │       │   ├── document-store.ts
│   │       │   ├── files-store.ts
│   │       │   ├── notebook-store.ts
│   │       │   ├── sidebar-store.ts
│   │       │   ├── sidebar-chat-store.ts
│   │       │   ├── right-sidebar-store.ts
│   │       │   ├── settings-store.ts
│   │       │   ├── tabs-store.ts
│   │       │   ├── user-store.ts
│   │       │   └── workspace-store.ts
│   │       ├── services/          # 前端服务层
│   │       ├── hooks/             # React Hooks
│   │       ├── lib/               # 工具函数
│   │       └── i18n/              # 国际化
│   │
│   └── open-node/                 # Node.js 后端（RAG 引擎）
│       └── src/
│           ├── api/               # REST API 端点
│           ├── services/          # 业务服务
│           ├── indexers/          # 代码索引器（tree-sitter）
│           ├── db/                # 数据库层（LevelDB, Qdrant, SurrealDB）
│           ├── jobs/              # 后台任务队列
│           ├── types/             # TypeScript 类型定义
│           ├── utils/             # 工具函数
│           └── config/            # 配置管理
│
├── docs/                          # 技术文档
├── openspec/                      # OpenSpec 变更提案
└── examples/                      # 代码示例
```

### 文件命名规范

| 文件类型        | 命名规范              | 示例                |
| --------------- | --------------------- | ------------------- |
| Rust 文件       | `snake_case.rs`       | `app_events.rs`     |
| TypeScript 文件 | `kebab-case.ts`       | `use-app-events.ts` |
| React 组件      | `kebab-case.tsx`      | `simple-editor.tsx` |
| 文档文件        | `UPPER_SNAKE_CASE.md` | `EVENT_SYSTEM.md`   |
| 脚本文件        | `kebab-case.sh`       | `build-all.sh`      |

### 重要约定

1. **不要手动编辑生成的代码**：`gen/` 目录、`routeTree.gen.ts` 等
2. **测试文件**：Rust 用 `#[cfg(test)]` 或 `tests/`；TypeScript 用 `*.test.ts`
3. **文档同步**：修改核心功能时，同步更新 `docs/` 中的相关文档

## 核心架构概述

Open-Context 采用 Tauri 混合架构，三层协作：

| 模块              | 职责                              | 技术栈                  | 运行端口 |
| ----------------- | --------------------------------- | ----------------------- | -------- |
| **open-app**      | 桌面外壳，本地 FS 操作、系统调用  | Rust + Tauri 2.x        | -        |
| **open-node**     | RAG 引擎，代码索引、向量检索      | Node.js + Hono          | 4500     |
| **open-web**      | React UI，用户界面和交互          | React 19 + TanStack Router | 1420     |

### 模块通信流程

```
用户操作 → open-web → Tauri IPC → open-app (本地 FS 操作)
                            ↓
                       启动 open-node
                            ↓
              open-web ←→ open-node (HTTP/WebSocket)
              open-app ←→ open-node (HTTP/WebSocket)
```

详细架构文档请参考：
- [AGENTS.md](./AGENTS.md) - 完整的项目架构和编码规范
- [共享存储规范](./docs/SHARED_STORAGE.md) - 数据存储路径
- [Tauri 端文档](./docs/APP_TAURI.md) - Tauri 命令和事件系统
- [Node.js 后端文档](./docs/NODE_BACKEND.md) - RAG 系统和 API 设计

## 核心数据流

### 事件系统工作流

**后端发送事件（Rust）**：

```rust
use open_app_lib::{EventEmitter, AppEvent};

let emitter = EventEmitter::new(app.handle().clone());
let event = AppEvent::AppReady { timestamp: AppEvent::now() };
emitter.emit_global(&event)?;
```

**前端监听事件（React）**：

```tsx
import { useThemeEvent } from '@/hooks/use-app-events';

function MyComponent() {
  const theme = useThemeEvent('system');
  return <div>Theme: {theme}</div>;
}
```

详细事件分类和类型请参考 `apps/open-app/src/app_events/event_type.rs`。

### 文件树工作流

**后端加载（Rust）**：

```rust
use open_app_lib::app_service::app_file_tree::read_dir_on_demand;

let nodes = read_dir_on_demand(dir_path).await?;
```

- 5 分钟缓存机制（避免频繁扫描）
- 使用 `ignore` crate（自动忽略 .gitignore 文件）
- notify 监听文件系统变化
- 跨平台隐藏文件检测（Windows FILE_ATTRIBUTE_HIDDEN，Unix 点开头）
- 50ms 防抖（避免频繁触发）

**前端渲染（React）**：

```tsx
import { FileTree } from '@/components/file-tree';

<FileTree rootPath="/path/to/folder" onSelect={(path) => console.log(path)} />;
```

- 递归渲染，按需加载子节点
- 右键菜单（复制路径、在 Finder/Explorer 打开、删除）
- 面包屑导航 + 文件搜索
- 使用 Tauri `invoke` 调用后端 API

### RAG 索引流程

1. 用户触发：`POST /repos/:repoId/index`
2. JobService 创建任务 → JobQueue 入队
3. IndexJob 执行：
   - GitService 读取文件 → SymbolExtractor 解析 AST → 提取符号
   - CodeChunkBuilder 生成代码块 → VectorService 生成嵌入向量
   - GraphBuilder 构建依赖关系：
     - 存储到 LevelDB（实时索引）
     - 同步到 SurrealDB（全文检索 + 图查询）
     - 存储到 Qdrant（向量检索）
   - GraphService 加载到内存
4. 任务状态更新：0% → 30% → 60% → 80% → 100%

### RAG 查询流程

1. 用户查询：`POST /query/code`
2. RAGService 根据查询类型选择存储层：
   - **向量搜索**：VectorService 生成查询向量 → Qdrant 搜索 top-K 相似符号
   - **全文搜索**：SurrealDB BM25 搜索符号名称或代码内容
   - **图查询**：SurrealDB 查找符号依赖链、调用关系
3. GraphService 扩展结果，包含依赖关系
4. 返回包含上下文的丰富结果

## 常用命令

### 开发

```bash
# 启动所有组件（Tauri + Node.js + React）
pnpm dev

# 单独启动组件
pnpm dev:web       # 仅 React 前端 (http://localhost:1420)
pnpm dev:server    # 仅 Node.js 服务器 (http://localhost:4500)
pnpm dev:app       # Tauri 应用（无文件监听）
```

### 构建

```bash
# 构建所有组件
pnpm build:all

# 单独构建
pnpm build:web     # React 前端
pnpm build:server  # Node.js 服务器
pnpm build:app     # Tauri 桌面应用
```

### 测试

```bash
# Rust 测试
cargo test --lib
cargo test --lib app_events        # 测试特定模块

# Node.js 测试
pnpm --filter open-node test
pnpm --filter open-node test:watch
pnpm --filter open-node test:coverage

# 前端测试
pnpm --filter open-web test
```

### 代码检查与格式化

```bash
# 检查并自动修复
pnpm lint           # 所有代码
pnpm lint:rs        # Rust (cargo clippy)
pnpm lint:js        # JavaScript/TypeScript (oxlint)

# 格式化
pnpm fmt            # 所有代码
pnpm fmt:rs         # Rust (cargo fmt)
pnpm fmt:js         # JavaScript/TypeScript (Prettier)
```

## 存储架构

所有数据存储在 `~/.open-context/` 目录下（可通过 `OPEN_CONTEXT_HOME` 环境变量自定义）。

```
~/.open-context/
├── bin/            # 二进制文件（sidecar模式）
├── cache/          # 缓存目录（Tauri Store 持久化文件）
│   ├── chat-store.store.json      # 对话状态
│   ├── right-sidebar.store.json   # 右侧栏状态
│   ├── notebook-store.store.json  # 笔记状态
│   └── workspace-store.store.json # 工作空间状态
├── config/         # 配置文件（config.json）
├── database/       # 数据库数据
│   ├── app_state.db    # SQLite 数据库（Tauri 端）
│   ├── surrealdb/      # SurrealDB 数据库（图数据库）
│   ├── leveldb/        # LevelDB 数据库
│   │   ├── main/           # 主数据库（符号、元数据）
│   │   ├── edges/          # 正向边（依赖关系）
│   │   └── reverse-edges/  # 反向边（被依赖关系）
│   └── qdrant/         # Qdrant 向量数据库（需独立部署）
├── notebook/       # 笔记数据
├── session/        # 会话数据
├── workspace/      # 工作空间数据
├── files/          # 文件索引数据
├── logs/           # 应用日志
├── plugins/        # 插件配置
├── commands/       # 命令历史/配置
├── skills/         # Skills 数据
├── todos/          # Todo 数据
├── projects/       # 项目数据
├── rules/          # 规则数据
└── hooks/          # Hooks 配置
```

### 数据库技术栈

| 数据库          | 用途                         | 位置                            |
| --------------- | ---------------------------- | ------------------------------- |
| **SQLite**      | 元数据、状态管理             | `database/app_state.db`         |
| **LevelDB**     | 符号、依赖关系图（实时索引） | `database/leveldb/`             |
| **SurrealDB**   | 全文检索、图数据库、关系查询 | `database/surrealdb/` 或远程    |
| **Qdrant**      | 向量嵌入、语义搜索           | 独立部署或远程                  |
| **Tauri Store** | 前端状态持久化               | `cache/*.store.json`            |

详细存储规范请参考 [docs/SHARED_STORAGE.md](./docs/SHARED_STORAGE.md)。

## 时间处理规范

**统一时间格式**：毫秒级时间戳（Milliseconds since Unix Epoch）

**Rust 端（chrono）**：

```rust
use chrono::Utc;

// 获取当前时间戳（毫秒）
fn now_millis() -> i64 {
    Utc::now().timestamp_millis()
}

// 格式化输出（仅用于日志）
use chrono::DateTime;
let dt = DateTime::from_timestamp_millis(timestamp).unwrap();
let formatted = dt.format("%Y-%m-%d %H:%M:%S%.3f").to_string();
```

**TypeScript/React 端（dayjs）**：

```typescript
import dayjs from 'dayjs';

// 获取当前时间戳（毫秒）
const nowMillis = (): number => dayjs().valueOf();

// 格式化输出
const formatted = dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS');

// 相对时间
const relative = dayjs(timestamp).fromNow(); // "2 小时前"
```

**最佳实践**：

- 存储和传输始终使用时间戳（`i64` 或 `number`）
- 仅在展示给用户时才格式化
- dayjs 自动处理时区转换

## API 端点

Node.js 服务器运行在 `http://localhost:4500`：

```
/api/v1/workspaces              # 工作空间 CRUD
/api/v1/workspaces/{id}/repos   # 仓库管理
/api/v1/repos/{id}/index        # 触发索引任务
/api/v1/query/vector            # 语义搜索
/api/v1/query/code              # 代码搜索（向量 + 图）
/api/v1/graph/*                 # 依赖关系图查询
/api/v1/jobs/{id}               # 任务状态查询
```

详细 API 设计请参考 [docs/NODE_BACKEND.md](./docs/NODE_BACKEND.md)。

## 开发实践

### 前端开发 (open-web)

**组件模式**：

- React 组件必须使用箭头函数：`export const Component = () => {}`（禁止 function 声明）
- UI 组件基于 Radix UI primitives 和 shadcn/ui
- 使用 `cn()` 工具函数合并 Tailwind 类名
- Props 接口命名为 `{组件名}Props`

**状态管理**：

- Zustand：客户端全局状态（`src/storage/` 目录）
- React Query：服务端状态和缓存
- Tauri Store：持久化存储（`~/.open-context/cache/*.store.json`）

**路由约定**：

- 使用 TanStack Router 文件系统路由
- `__root.tsx` 为根布局，包裹全局 Provider
- 路由组件通过 `createFileRoute` 创建

**国际化**：

- 翻译文件位于 `src/i18n/locales/`
- 使用 `useTranslation` Hook 访问翻译函数
- 支持语言：zh-CN, en, ja, ko, zh-TW

### 后端开发 (open-app)

**命名规范**：

- 模块/函数/变量：snake_case
- 类型/结构体/枚举：PascalCase

**错误处理**：

- 使用 `anyhow::Result<T, E>` 类型
- 使用 `?` 操作符传播错误
- 谨慎使用 `.expect()`（优先使用 `?` 或优雅解包）

### Node.js RAG 引擎开发 (open-node)

**目录结构**：

```
src/
├── api/       # REST 端点 (Hono 路由)
├── services/  # 业务逻辑
├── db/        # 数据访问 (LevelDB, Qdrant, SurrealDB)
├── indexers/  # 代码解析 (tree-sitter)
├── jobs/      # 异步任务
├── utils/     # 工具函数
├── types/     # TypeScript 定义
└── config/    # 配置管理
```

**服务模式**：

```typescript
export class ServiceName {
  private repo = new RepositoryName();

  async operation(dto: CreateDto): Promise<Entity> {
    logger.info({ field: value }, 'Operation');
    const entity = await this.repo.create(dto);
    logger.info({ id: entity.id }, 'Created');
    return entity;
  }
}
```

## 重要说明

### 当前限制

- **语言支持**：仅实现了 TypeScript/JavaScript 索引
- **Rust 后端**：
  - ✅ 事件系统、状态管理、配置管理已完整实现
  - ✅ 文件树管理（缓存、监听）已完整实现
  - ✅ 任务调度系统已完整实现
  - ⏳ Tauri 与 Node.js IPC 功能待实现
  - ⏳ 进程管理器（app_sidecar.rs）待实现
- **前端**：
  - ✅ UI 框架、事件系统 Hooks 已完整实现
  - ✅ 三栏布局（左侧栏、中间区、右侧 Explorer）已实现
  - ✅ 文件树组件（递归、右键菜单）已实现
  - ✅ 标签页系统（多标签管理）已实现
  - ⏳ 与 Node.js RAG 服务的 API 集成待完成
  - ⏳ 笔记富文本编辑器集成待完成
- **Node.js 后端**：
  - ✅ RAG 引擎已实现
  - ⏳ 使用简单的内存队列（BullMQ 已导入但未使用）

### 开发建议

1. **简化实现**：只做明确要求的事，不要自作主张加功能
2. **避免冗余**：不添加未被要求的注释、类型注解或错误处理
3. **信任内部代码**：只在系统边界（用户输入、外部 API）进行验证
4. **删除废弃代码**：不使用 `_var` 重命名或 `// removed` 注释，直接删除
5. **禁止类型抑制**：不使用 `as any`、`@ts-ignore`、`@ts-expect-error`

## 配置文件

| 文件                           | 说明                              |
| ------------------------------ | --------------------------------- |
| `tauri.conf.json`              | Tauri 应用配置（窗口、打包、更新） |
| `Cargo.toml`                   | Rust 依赖和构建配置               |
| `apps/open-node/package.json`  | Node.js 服务依赖                  |
| `apps/open-web/package.json`   | 前端依赖                         |
| `.oxlintrc.json`               | JavaScript/TypeScript 检查规则    |
| `.prettierrc`                  | 代码格式化规则                    |
| `pnpm-workspace.yaml`          | Monorepo 工作区配置               |

## 文档参考

### 核心文档

- [AGENTS.md](./AGENTS.md) - 完整的项目架构和编码规范
- [README.md](./README.md) - 项目概述和快速开始
- [共享存储规范](./docs/SHARED_STORAGE.md) - 数据存储路径规范
- [Tauri 端文档](./docs/APP_TAURI.md) - Tauri 命令、事件系统
- [Node.js 后端文档](./docs/NODE_BACKEND.md) - API 设计、RAG 系统

### 子项目文档

- [open-node README](./apps/open-node/README.md) - RAG 引擎详细文档
- [open-web README](./apps/open-web/README.md) - 前端架构文档

### 代码示例

- [apps/open-web/src/components/event-demo.tsx](./apps/open-web/src/components/event-demo.tsx) - React 事件示例
- [apps/open-web/src/components/file-tree/file-tree-demo.tsx](./apps/open-web/src/components/file-tree/file-tree-demo.tsx) - 文件树示例
