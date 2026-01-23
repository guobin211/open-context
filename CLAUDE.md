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
├── src/                           # Rust 源码（Tauri 后端）
│   ├── app_state*.rs              # 状态管理和数据模型
│   ├── app_events.rs              # 事件系统定义
│   ├── app_config.rs              # 配置管理
│   ├── app_commands.rs            # Tauri IPC 命令
│   ├── app_file_tree.rs           # 文件树管理（缓存、监听）
│   ├── app_file_tree_commands.rs  # 文件树 Tauri 命令
│   ├── app_task.rs                # 任务调度系统
│   └── main.rs                    # 应用入口
│
├── packages/
│   ├── open-web/                  # React 前端
│   │   └── src/
│   │       ├── components/        # UI 组件
│   │       │   ├── layout/        # 布局组件（三栏布局）
│   │       │   ├── sidebar/       # 侧边栏组件（树形结构）
│   │       │   ├── file-tree/     # 文件树组件（递归、右键菜单）
│   │       │   ├── files/         # 文件视图组件
│   │       │   ├── welcome/       # 欢迎页组件
│   │       │   └── ui/            # shadcn/ui 基础组件
│   │       ├── routes/            # TanStack Router（文件系统路由）
│   │       ├── storage/           # Zustand 状态管理（11 个 store）
│   │       ├── services/          # 前端服务层
│   │       └── hooks/             # React Hooks
│   │
│   └── open-node/                 # Node.js 后端（RAG 引擎）
│       └── src/
│           ├── services/          # 业务服务
│           ├── indexers/          # 代码索引器（tree-sitter）
│           ├── db/                # 数据库层（LevelDB, Qdrant）
│           ├── api/               # REST API 端点
│           └── types/             # TypeScript 类型定义
│
├── docs/                          # 技术文档
├── openspec/                      # OpenSpec 变更提案
├── examples/                      # 代码示例
└── tests/                         # 测试文件
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

## 核心架构

### 1. Rust Tauri 后端 (src/)

- **桌面外壳**：应用窗口管理、系统集成、IPC 通信
- **核心模块**：
  - `app_state*.rs`：基于 SQLite 的状态管理（工作空间、笔记、文件、对话、仓库链接）
  - `app_events.rs` + `app_event_emitter.rs`：事件系统（27+ 种事件，多窗口支持）
  - `app_config.rs`：应用配置管理（线程安全、热重载）
  - `app_commands.rs`：Tauri IPC 命令（CRUD 操作、文件读写）
  - `app_file_tree.rs`：文件树管理（5 分钟缓存、notify 监听、跨平台隐藏文件检测）
  - `app_file_tree_commands.rs`：文件树 Tauri 命令（按需加载、监听）
  - `app_task.rs`：任务调度系统（后台任务管理）

**详细文档**：

- [事件系统文档](docs/APP_EVENT_SYSTEM.md)
- [配置管理文档](./docs/APP_CONFIG_USAGE.md)
- [Tauri 命令参考](docs/APP_TAURI_COMMANDS.md)
- [配色方案](docs/APP_COLOR_PALETTE.md)

### 2. Node.js 后端 (packages/open-node)

**RAG 引擎核心**，运行在 4500 端口：

- **核心服务**：IndexerService、GraphService、RAGService、VectorService、JobService
- **索引器**：SymbolExtractor（Tree-sitter AST 解析）、CodeChunkBuilder、GraphBuilder
- **存储层**：LevelDB（符号、依赖关系图）、Qdrant（向量检索）
- **任务队列**：JobQueue（顺序处理），IndexJob、ReindexJob

**当前限制**：仅支持 TypeScript/JavaScript 索引

### 3. React 前端 (packages/open-web)

运行在 1420 端口（开发模式）：

- **技术栈**：React 19、Vite、TypeScript、Tailwind CSS 4、shadcn/ui、Tiptap
- **路由**：TanStack Router（文件系统路由，自动生成 `routeTree.gen.ts`）
- **状态管理**：
  - `chat-store.ts` - 对话会话、消息管理
  - `notebook-store.ts` - 笔记组织、收藏管理
  - `files-store.ts` - 文件分组、最近文件
  - `workspace-store.ts` - 工作空间、资源管理
  - `tabs-store.ts` - 标签页管理（最多 10 个）
  - `sidebar-store.ts` - 侧边栏展开/收起
  - `right-sidebar-store.ts` - 右侧 Explorer 面板
- **UI 布局**：
  - `main-layout.tsx` - 三栏布局容器
  - `top-search-bar.tsx` - 顶部搜索栏
  - `sidebar.tsx` - 左侧栏（对话树、笔记树、资源树）
  - `content-area.tsx` - 中间内容区（标签页 + AI 输入栏）
  - `explorer-panel.tsx` - 右侧 Explorer 面板（文件夹树）
  - `status-bar.tsx` - 底部状态栏
- **文件树组件**：
  - `file-tree.tsx` - 递归文件树（延迟加载、虚拟滚动）
  - `file-tree-context-menu.tsx` - 右键菜单
  - `breadcrumb.tsx` - 面包屑导航
  - `file-search.tsx` - 文件搜索
- **国际化**：i18next（支持简体中文、繁体中文、English、日本語、한국어）

## 核心数据流

### 事件系统工作流

**后端发送事件（Rust）**：

```rust
use open_context_lib::{EventEmitter, AppEvent};

let emitter = EventEmitter::new(app.handle().clone());
let event = AppEvent::AppReady { timestamp: AppEvent::now() };
emitter.emit_global(&event)?;
```

**前端监听事件（React）**：

```tsx
import { useThemeEvent, useServiceStatus } from '@/hooks/use-app-events';

function MyComponent() {
  const theme = useThemeEvent('system');
  const nodeServer = useServiceStatus('node-server');
  return (
    <div>
      Theme: {theme}, Server: {nodeServer.isRunning}
    </div>
  );
}
```

详细文档：[docs/APP_EVENT_SYSTEM.md](docs/APP_EVENT_SYSTEM.md)

### 文件树工作流

**后端加载（Rust）**：

```rust
use open_context_lib::app_file_tree::read_dir_on_demand;

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
   - GraphBuilder 构建依赖关系 → 存储到 LevelDB 和 Qdrant
   - GraphService 加载到内存
4. 任务状态更新：0% → 30% → 60% → 80% → 100%

### RAG 查询流程

1. 用户查询：`POST /query/code`
2. RAGService：
   - VectorService 生成查询向量 → Qdrant 搜索 top-K 相似符号
   - GraphService 扩展结果，包含依赖关系（可选）
   - 返回包含上下文的丰富结果

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
cargo run --example event_usage    # 运行示例

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

### 数据存储位置

所有数据存储在 `~/.config/open-context/`（可通过 `OPEN_CONTEXT_CONFIG_DIR` 环境变量自定义），另外前端状态持久化使用 Tauri Store，存储在 `~/.open-context/cache/` 下。

```
~/.config/open-context/
├── config.json          # 全局配置
├── app_state.db         # SQLite 数据库（工作空间、笔记、文件、对话）
├── leveldb/             # LevelDB 数据库
│   ├── main/            # 主数据库（符号、元数据）
│   ├── edges/           # 正向边（依赖关系）
│   └── reverse-edges/   # 反向边（被依赖关系）
├── qdrant/              # Qdrant 向量数据库
├── logs/                # 应用日志
└── workspaces/          # 工作空间数据
    └── {workspace-id}/
        ├── repos/       # Git 仓库缓存
        ├── files/       # 文件资源
        └── notes/       # 笔记数据

~/.open-context/cache/
└── store.bin            # Tauri Store（前端状态持久化）
```

### 数据库技术栈

| 数据库          | 用途               | 位置             |
| --------------- | ------------------ | ---------------- |
| **SQLite**      | 元数据、状态管理   | `app_state.db`   |
| **LevelDB**     | 符号、依赖关系图   | `leveldb/`       |
| **Qdrant**      | 向量嵌入、语义搜索 | `qdrant/` 或远程 |
| **Tauri Store** | 前端状态持久化     | `store.bin`      |

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

- `/workspaces/*` - 工作空间 CRUD
- `/repos/*` - 仓库管理
- `/repos/:repoId/index` - 触发索引任务
- `/query/vector` - 语义搜索
- `/query/code` - 代码搜索（向量 + 图）
- `/graph/*` - 依赖关系图查询

详细 API 文档：[docs/TAURI_COMMANDS.md](docs/APP_TAURI_COMMANDS.md)

## 开发实践

### 前端开发

**组件开发**：

- UI 组件基于 Radix UI primitives 和 shadcn/ui
- 使用 `cn()` 工具函数合并 Tailwind 类名
- Tiptap 编辑器组件遵循分层架构

**状态管理**：

- Zustand：客户端全局状态
- React Query：服务端状态和数据缓存
- usePersistedState：使用 Tauri Store 持久化状态

**路由约定**：

- 使用 TanStack Router 文件系统路由
- `__root.tsx` 为根布局，包裹全局 Provider
- 路由组件通过 `createFileRoute` 创建

**国际化**：

- 翻译文件位于 `src/i18n/locales/`
- 使用 `useTranslation` Hook 访问翻译函数

### 后端开发（Rust）

**事件系统**：

- 添加新事件：在 `app_events.rs` 中添加枚举变体
- 同步更新 `packages/open-web/src/types/app-events.types.ts`
- 如需要，在 `use-app-events.ts` 中添加便捷 Hook
- 参考 `examples/event_usage.rs`

**状态管理**：

- 所有数据操作通过 `DatabaseManager`
- 使用 `Arc<Mutex<Connection>>` 保证线程安全
- 自动更新 `updated_at` 时间戳

**配置管理**：

- 使用 `ConfigManager` 进行线程安全的配置访问
- 修改配置后自动保存
- 参考 `examples/config_usage.rs`

### Node.js RAG 引擎开发

**添加语言支持**：

1. 安装 tree-sitter 解析器包
2. 在 `SymbolExtractor.extractSymbols()` 中添加语言特定的 AST 查询
3. 更新 `ASTParser` 以识别新语言
4. 在 `GraphBuilder` 中添加节点类型映射

**性能优化**：

- 连接池支持
- 查询缓存
- 批量插入优化

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
  - ✅ 欢迎页已实现
  - ⏳ 与 Node.js RAG 服务的 API 集成待完成
  - ⏳ 笔记富文本编辑器集成待完成
- **Node.js 后端**：
  - ✅ RAG 引擎已实现
  - ⏳ 使用简单的内存队列（BullMQ 已导入但未使用）

### 开发建议

1. **避免过度工程**：只实现当前需要的功能，不添加额外特性
2. **保持简洁**：不添加未被要求的注释、类型注解或错误处理
3. **信任内部代码**：只在系统边界（用户输入、外部 API）进行验证
4. **删除未使用代码**：不使用 `_var` 重命名或 `// removed` 注释，直接删除

## 配置文件

| 文件                               | 说明                               |
| ---------------------------------- | ---------------------------------- |
| `tauri.conf.json`                  | Tauri 应用配置（窗口、打包、更新） |
| `Cargo.toml`                       | Rust 依赖和构建配置                |
| `packages/open-node/esbuild.mjs`   | Node.js 构建配置                   |
| `packages/open-web/vite.config.ts` | Vite/React 构建配置                |
| `.oxlintrc.json`                   | JavaScript/TypeScript 检查规则     |
| `.prettierrc`                      | 代码格式化规则                     |

## 文档参考

### 核心文档

- [README.md](./README.md) - 项目概述和快速开始
- [EVENT_SYSTEM.md](docs/APP_EVENT_SYSTEM.md) - 事件系统完整文档
- [APP_CONFIG_USAGE.md](./docs/APP_CONFIG_USAGE.md) - 配置管理使用指南
- [TAURI_COMMANDS.md](docs/APP_TAURI_COMMANDS.md) - Tauri IPC 命令参考
- [APP_COLOR_PALETTE.md](docs/APP_COLOR_PALETTE.md) - 应用配色方案
- [OpenSpec 变更提案](openspec/) - 功能提案和设计文档

### 代码示例

- [examples/event_usage.rs](./examples/event_usage.rs) - 事件系统示例
- [examples/config_usage.rs](./examples/config_usage.rs) - 配置管理示例
- [packages/open-web/src/components/event-demo.tsx](./packages/open-web/src/components/event-demo.tsx) - React 事件示例
- [packages/open-web/src/components/file-tree/file-tree-demo.tsx](./packages/open-web/src/components/file-tree/file-tree-demo.tsx) - 文件树示例
