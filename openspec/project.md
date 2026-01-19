# 项目上下文

## 目的

Open-Context 是一个开源的笔记、文件、工作空间管理工具，旨在帮助 AI Agent 更好地理解和利用上下文信息。

**核心目标**：

- 为 AI Agent 提供丰富的上下文信息支持
- 支持多模态笔记管理（富文本、Markdown、代码、表格、思维导图、流程图）
- 提供基于向量数据库的语义检索能力
- 构建代码依赖关系图，支持 RAG（检索增强生成）查询
- 通过 MCP（模型上下文协议）对外提供标准化服务

**目标用户**：

- AI 应用开发者
- 需要管理大量上下文信息的知识工作者
- 开发团队（代码索引和检索）

## 技术栈

### 桌面外壳

- **Tauri 2.x**：跨平台桌面应用框架
- **Rust 1.90.0+**：系统编程语言，用于后端核心逻辑

### 后端服务

- **Node.js 18.0.0+**：JavaScript 运行时
- **Hono**：轻量级 Web 框架
- **TypeScript**：类型安全的 JavaScript 超集
- **Tree-sitter**：增量语法解析器（代码索引）

### 前端界面

- **React 19**：用户界面库
- **Vite**：构建工具和开发服务器
- **TypeScript**：类型安全
- **Tailwind CSS 4**：原子化 CSS 框架
- **Radix UI**：无障碍 UI 组件库
- **shadcn/ui**：UI 组件集合
- **TanStack Router**：类型安全的文件系统路由
- **Tiptap**：富文本编辑器框架（基于 ProseMirror）

### 数据存储

- **SQLite**：关系型数据库（Rust 端，元数据和状态管理）
- **LevelDB**：键值数据库（Node.js 端，符号和依赖关系图）
- **Qdrant**：向量数据库（语义搜索）
- **Tauri Store**：前端状态持久化

### 状态管理

- **Zustand**：轻量级状态管理（客户端）
- **React Query**：服务端状态管理和数据缓存

### 开发工具

- **pnpm 9.0.0+**：包管理器（Monorepo 支持）
- **cargo**：Rust 包管理器和构建工具
- **oxlint**：JavaScript/TypeScript 代码检查
- **Prettier**：代码格式化
- **Vitest**：测试框架（Node.js）

### 其他技术

- **chrono**：Rust 时间处理库
- **dayjs**：JavaScript 时间处理库
- **i18next**：国际化框架（支持 5 种语言）
- **serde**：Rust 序列化/反序列化
- **Monaco Editor**：代码编辑器
- **Handsontable**：表格编辑器
- **Konva.js**：Canvas 图形库（思维导图）
- **Mermaid.js**：图表渲染（流程图）

## 项目约定

### 代码风格

**Rust 代码**：

- 使用 `cargo fmt` 格式化（标准 Rust 风格）
- 使用 `cargo clippy` 进行代码检查
- 文件命名：`snake_case.rs`（如 `app_events.rs`）
- 模块命名：以 `app_` 为前缀表示应用核心模块
- 错误处理：统一使用 `Result<T, Box<dyn std::error::Error>>`
- 并发安全：使用 `Arc<Mutex<T>>` 或 `RwLock<T>`

**TypeScript/JavaScript 代码**：

- 使用 Prettier 格式化
- 使用 oxlint 进行类型感知检查
- 文件命名：`kebab-case.ts` 或 `kebab-case.tsx`（如 `use-app-events.ts`）
- React 组件：函数式组件 + Hooks
- 类型定义：优先使用 `interface`，枚举使用 `type`
- 导入顺序：外部库 → 内部模块 → 类型定义 → 样式

**文档**：

- 文件命名：`UPPER_SNAKE_CASE.md`（如 `EVENT_SYSTEM.md`）
- 使用中文编写（除非明确说明使用英文）
- Markdown 格式遵循 CommonMark 规范

**脚本**：

- 文件命名：`kebab-case.sh` 或 `.mjs`
- 所有脚本添加 shebang 和执行权限
- Shell 脚本使用 bash

### 命名约定

| 类型            | 约定                            | 示例                               |
| --------------- | ------------------------------- | ---------------------------------- |
| Rust 变量       | snake_case                      | `event_emitter`                    |
| Rust 类型       | PascalCase                      | `AppState`                         |
| Rust 常量       | SCREAMING_SNAKE_CASE            | `MAX_RETRY_COUNT`                  |
| TypeScript 变量 | camelCase                       | `eventHandler`                     |
| TypeScript 类型 | PascalCase                      | `AppConfig`                        |
| TypeScript 常量 | SCREAMING_SNAKE_CASE            | `API_BASE_URL`                     |
| React 组件      | PascalCase（文件用 kebab-case） | `SimpleEditor` (simple-editor.tsx) |
| CSS 类名        | kebab-case                      | `button-primary`                   |

### 架构模式

**整体架构**：

- **混合桌面应用**：Tauri (Rust) + Node.js RAG 引擎 + React 前端
- **Monorepo 结构**：使用 pnpm workspaces 管理子项目
- **分层架构**：
  - 桌面外壳层（Tauri/Rust）：窗口管理、系统集成、IPC
  - 后端服务层（Node.js）：RAG 引擎、代码索引、向量检索
  - 前端界面层（React）：用户交互、数据展示

**Rust 后端模式**：

- **模块化设计**：每个功能一个模块文件（`app_*.rs`）
- **状态管理**：使用 SQLite + 线程安全包装（Arc<Mutex>）
- **事件驱动**：完整的事件系统，27+ 种事件类型
- **配置管理**：线程安全的配置管理器（RwLock）
- **错误处理**：Result 类型 + 自定义错误类型

**Node.js 后端模式**：

- **服务层模式**：Service → Repository → Database
- **索引流程**：GitService → SymbolExtractor → CodeChunkBuilder → VectorService → LevelDB/Qdrant
- **查询流程**：VectorService（相似度搜索） + GraphService（依赖关系扩展）
- **任务队列**：简单内存队列（顺序处理）

**React 前端模式**：

- **文件系统路由**：TanStack Router 自动生成路由
- **组件分层**：
  - UI primitives（Radix UI）
  - UI components（shadcn/ui）
  - Feature components（业务组件）
  - Page components（路由页面）
- **状态管理**：
  - 客户端全局状态：Zustand
  - 服务端状态：React Query
  - 持久化状态：Tauri Store
- **Tiptap 编辑器分层**：extension → node → ui-primitive → ui → templates

### 测试策略

**Rust 测试**：

- 单元测试：放在源文件的 `#[cfg(test)]` 模块中
- 集成测试：放在 `tests/integration/` 目录
- 运行测试：`cargo test --lib`
- 测试覆盖：核心模块（events、state、config）需要完整测试
- 命名约定：测试函数以 `test_` 为前缀

**Node.js 测试**：

- 测试框架：Vitest
- 测试文件：`*.test.ts` 或 `*.spec.ts`
- 运行测试：`pnpm --filter open-node test`
- 覆盖率：使用 `pnpm --filter open-node test:coverage`
- 监听模式：`pnpm --filter open-node test:watch`

**前端测试**：

- 测试框架：Vitest + React Testing Library
- 测试文件：`*.test.tsx` 或 `*.spec.tsx`
- 运行测试：`pnpm --filter open-web test`
- 组件测试：优先测试用户交互和业务逻辑

**测试原则**：

- 避免过度测试：不测试第三方库和框架
- 关注业务逻辑：核心功能必须有测试
- 保持简洁：测试代码应该易读易维护

### Git 工作流

**分支策略**：

- `master`：主分支，始终保持可发布状态
- `feature/*`：功能分支，从 master 创建
- `fix/*`：修复分支，从 master 创建
- `hotfix/*`：紧急修复分支

**提交约定**：

- 使用中文提交信息
- 提交格式：`<type>: <description>`
- 类型：
  - `feat`：新功能
  - `fix`：Bug 修复
  - `docs`：文档更新
  - `style`：代码格式（不影响功能）
  - `refactor`：重构
  - `test`：测试
  - `chore`：构建或工具变更

**提交示例**：

```
feat: 添加事件系统支持多窗口实例

- 新增 WindowId 结构体用于区分窗口
- 实现 emit_to_window() 方法
- 添加 10+ 个 React Hooks 简化事件监听

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Pull Request 流程**：

1. 创建功能分支
2. 完成开发并通过所有测试
3. 更新相关文档
4. 提交 PR，填写清晰的描述
5. Code Review
6. 合并到 master

**重要规则**：

- ❌ 禁止 force push 到 main/master
- ❌ 禁止跳过 pre-commit hooks（除非明确请求）
- ✅ 提交前运行 `pnpm lint` 和 `pnpm test`
- ✅ 功能完成后更新文档（README、CLAUDE.md、docs/）

### 时间处理约定

**统一格式**：毫秒级时间戳（Milliseconds since Unix Epoch）

**Rust**：

- 使用 `chrono::Utc::now().timestamp_millis()` 获取时间戳
- 类型：`i64`
- 格式化仅用于日志和调试

**TypeScript/JavaScript**：

- 使用 `dayjs().valueOf()` 获取时间戳
- 类型：`number`
- 格式化使用 `dayjs(timestamp).format()`
- 相对时间使用 `dayjs(timestamp).fromNow()`

**原则**：

- 存储和传输：始终使用时间戳
- 展示：仅在用户界面展示时才格式化
- 时区：dayjs 自动处理时区转换

## 领域上下文

### RAG（检索增强生成）

本项目的核心是为 AI Agent 提供 RAG 能力：

**代码索引**：

- 使用 Tree-sitter 解析代码 AST
- 提取符号：函数、类、方法、接口、变量
- 生成代码块：包含上下文的可搜索代码片段
- 构建依赖图：IMPORTS、CALLS、IMPLEMENTS、EXTENDS 等关系

**向量检索**：

- 使用 Qdrant 存储代码块的嵌入向量（1024 维）
- 语义搜索：根据自然语言查询找到相关代码
- Top-K 检索：返回最相似的 K 个结果

**图遍历**：

- 使用 LevelDB 存储双向依赖关系图
- 正向边：A 依赖 B
- 反向边：B 被 A 依赖
- 扩展搜索结果：包含相关依赖的上下文

### 事件系统

完整的类型安全事件系统，支持前后端通信：

**事件分类**（27+ 种事件）：

1. 应用生命周期（4 种）：启动、就绪、退出
2. 窗口管理（13 种）：创建、聚焦、移动、调整大小、关闭
3. 应用状态（3 种）：主题、语言、网络状态
4. 服务管理（3 种）：服务启动、停止、错误
5. 系统事件（4 种）：通知、更新、错误报告
6. 自定义事件：业务特定事件

**关键特性**：

- 多窗口支持：通过 WindowId 区分实例
- 类型同步：Rust 和 TypeScript 类型完全一致
- 自动清理：React Hooks 自动管理监听器生命周期

### MCP（模型上下文协议）

项目通过 MCP 对外提供服务：

**提供的能力**：

- 笔记检索：根据查询检索相关笔记
- 代码检索：根据自然语言查询检索代码
- 文件检索：语义检索文件内容
- 工作空间管理：查询和管理工作空间资源

**协议实现**：

- RESTful API：标准 HTTP 接口
- WebSocket：实时事件推送
- 类型定义：完整的 TypeScript 类型定义

## 重要约束

### 技术约束

**语言支持**：

- ⚠️ 当前仅支持 TypeScript/JavaScript 代码索引
- Tree-sitter 已集成 Bash、CSS、HTML、JSON 解析器，但未实现符号提取
- 未来计划：Python、Rust、Go、Java

**性能约束**：

- 向量数据库：建议使用远程 Qdrant 服务（本地部署占用资源较大）
- 任务队列：当前为简单内存队列，不支持并发（已导入 BullMQ 但未使用）
- 索引速度：大型仓库（10000+ 文件）索引较慢

**平台约束**：

- Tauri 支持：macOS、Windows、Linux
- Node.js 版本：18.0.0+（使用了 ES2022 特性）
- Rust 版本：1.90.0+（使用了最新稳定版特性）

### 业务约束

**数据隐私**：

- 所有数据本地存储（`~/.config/open-context/`）
- 支持自定义配置目录（环境变量 `OPEN_CONTEXT_CONFIG_DIR`）
- 向量检索可配置使用本地或远程 Qdrant

**资源管理**：

- 工作空间数量：无硬性限制，但建议不超过 50 个
- 单个工作空间大小：建议不超过 10GB
- 笔记数量：建议单个工作空间不超过 10000 条

### 开发约束

**避免过度工程**：

- 只实现当前需要的功能
- 不添加未被要求的特性、注释、错误处理
- 不为假设的未来需求设计

**保持简洁**：

- 3 行相似代码优于过早抽象
- 只在系统边界（用户输入、外部 API）进行验证
- 信任内部代码和框架保证

**删除未使用代码**：

- 不使用 `_var` 重命名或 `// removed` 注释
- 直接删除未使用的代码
- 不添加向后兼容性的 hack

## 外部依赖

### 必需服务

**Qdrant 向量数据库**：

- 用途：存储和检索代码块的嵌入向量
- 默认地址：`http://localhost:6333`
- 可配置：支持远程服务
- 向量维度：1024
- 集合：`code_symbols`

### 可选服务

**COS 云存储**：

- 用途：文件同步到云端
- 当前状态：规划中，未实现

### 系统依赖

**开发环境**：

- Rust：1.90.0+（`cargo --version`）
- Node.js：18.0.0+（`node --version`）
- pnpm：9.0.0+（`pnpm --version`）

**运行时依赖**：

- SQLite：3.x（Rust 使用 bundled 版本，无需单独安装）
- LevelDB：通过 npm 包安装，无需单独安装

### 开发工具依赖

**代码检查**：

- cargo clippy（Rust）
- oxlint（JavaScript/TypeScript）

**代码格式化**：

- cargo fmt（Rust）
- Prettier（JavaScript/TypeScript）

**测试框架**：

- Rust 内置测试框架
- Vitest（Node.js 和前端）

## 数据存储位置

所有数据存储在配置目录：`~/.config/open-context/`

```
~/.config/open-context/
├── config.json          # 全局配置
├── app_state.db         # SQLite 数据库（工作空间、笔记、文件）
├── store.bin            # Tauri Store（前端状态持久化）
├── leveldb/             # LevelDB 数据库
│   ├── main/            # 主数据库（符号、元数据）
│   ├── edges/           # 正向边（依赖关系）
│   └── reverse-edges/   # 反向边（被依赖关系）
├── qdrant/              # Qdrant 向量数据库（本地部署时）
├── logs/                # 应用日志
│   ├── app.log
│   ├── node-server.log
│   └── error.log
└── workspaces/          # 工作空间数据
    └── {workspace-id}/
        ├── repos/       # Git 仓库缓存
        ├── files/       # 文件资源
        └── notes/       # 笔记数据
```

## 文档资源

### 核心文档

- [README.md](../README.md) - 项目概述和快速开始
- [CLAUDE.md](../CLAUDE.md) - 完整的项目开发指南
- [EVENT_SYSTEM.md](../docs/EVENT_SYSTEM.md) - 事件系统详细文档
- [APP_STATE_USAGE.md](../docs/APP_STATE_USAGE.md) - 状态管理使用指南
- [APP_CONFIG_USAGE.md](../docs/APP_CONFIG_USAGE.md) - 配置管理使用指南
- [TAURI_COMMANDS.md](../docs/TAURI_COMMANDS.md) - Tauri IPC 命令参考

### 子项目文档

- [open-node README](../packages/open-node/README.md) - Node.js 后端详细文档
- [open-web README](../packages/open-web/README.md) - React 前端详细文档

### 代码示例

- [examples/event_usage.rs](../examples/event_usage.rs) - 事件系统 Rust 示例
- [examples/config_usage.rs](../examples/config_usage.rs) - 配置管理 Rust 示例
- [packages/open-web/src/components/event-demo.tsx](../packages/open-web/src/components/event-demo.tsx) - React 事件示例
