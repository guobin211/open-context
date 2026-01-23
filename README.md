# Open-Context

一款开源的 AI Agent 上下文管理工具，提供对话、笔记、文件、工作空间一体化的协作环境，帮助 AI Agent 更好地理解和利用上下文信息。

## ✨ 特性

- 💬 **对话管理** - 多会话对话、消息历史记录、智能上下文追踪
- 📝 **笔记系统** - 多类型笔记支持（富文本、Markdown 等）、笔记收藏、分类管理
- 📁 **文件管理** - 本地文件夹浏览、文件预览、最近文件记录、文件分类
- 🗂️ **工作空间** - Git 仓库管理、文档组织、资源聚合、多空间切换
- 🔍 **全局搜索** - 快速搜索项目、命令面板（⌘P）、智能联想
- 📂 **多标签页** - 对话、笔记、文件多标签管理、快速切换
- 🎨 **现代化 UI** - VS Code 风格界面、三栏布局、响应式设计
- 🌐 **AI 集成** - Copilot 智能输入、语音输入、、多工作区协作
- 🔄 **事件系统** - 完整的前后端通信机制
- 🌐 **浏览器支持** - 可以打开外部链接和网页内容
- 📂 **IDE集成** - 类似VS Code的文件资源管理器和终端工具
- ⚙️ **高度可配置** - 丰富的设置选项、主题定制、快捷键映射

## 🏗️ 项目架构

Open-Context 是一个基于 Tauri 的混合桌面应用，采用 Rust + TypeScript + Node.js 三层架构：

- **Tauri 桌面外壳**（Rust）：应用窗口管理、系统集成、IPC 通信、本地文件操作
- **Node.js 后端服务**：RAG 引擎、向量检索、代码索引、任务队列、API 服务
- **React 前端界面**：用户交互、VS Code 风格 UI、多标签页管理、状态管理

### 核心技术栈

| 层级     | 技术                         | 说明                      |
| -------- | ---------------------------- | ------------------------- |
| 桌面外壳 | Tauri 2.x + Rust             | 跨平台桌面框架            |
| 后端服务 | Node.js + Hono + TypeScript  | Web 框架 + RAG 引擎       |
| 前端界面 | React 19 + Vite + TypeScript | 现代前端技术栈            |
| 路由     | @tanstack/react-router       | 文件系统路由              |
| 状态管理 | Zustand + React Query        | 客户端/服务端状态         |
| UI 组件  | Radix UI + Tailwind CSS 4    | 无障碍组件库 + 原子化 CSS |
| 图标库   | Lucide React                 | 精美图标集                |
| 富文本   | Tiptap + ProseMirror         | 可扩展编辑器              |
| 数据库   | SQLite + LevelDB             | 嵌入式数据库              |
| 向量搜索 | Qdrant                       | 向量数据库                |
| 代码解析 | Tree-sitter                  | 语法解析器                |

## 📂 项目结构

```
open-context/
│
├── apps/
│   ├── open-app/                 # Tauri 桌面应用（Rust）
│   │   └── src/
│   │       ├── main.rs           # 应用入口
│   │       ├── lib.rs            # 库导出
│   │       ├── app_command/      # Tauri IPC 命令
│   │       │   ├── file_commands.rs
│   │       │   ├── file_tree_commands.rs
│   │       │   ├── note_commands.rs
│   │       │   ├── repository_commands.rs
│   │       │   ├── workspace_commands.rs
│   │       │   ├── task_commands.rs
│   │       │   └── system_commands.rs
│   │       ├── app_state/        # 状态管理与数据模型
│   │       │   ├── database.rs   # 数据库管理器
│   │       │   ├── state.rs      # 应用状态
│   │       │   ├── app_config.rs # 配置管理
│   │       │   ├── app_state_workspace.rs
│   │       │   ├── app_state_note.rs
│   │       │   ├── app_state_file.rs
│   │       │   ├── app_state_folder.rs
│   │       │   ├── app_state_repo.rs
│   │       │   └── app_state_link.rs
│   │       ├── app_events/       # 事件系统
│   │       │   ├── event_type.rs
│   │       │   └── event_emitter.rs
│   │       └── app_service/      # 业务服务
│   │           ├── app_file_tree.rs
│   │           ├── app_runtime.rs
│   │           ├── app_sidecar.rs
│   │           └── app_task.rs
│   │
│   ├── open-web/                 # React 前端
│   │   └── src/
│   │       ├── components/       # UI 组件
│   │       ├── routes/           # TanStack Router 路由
│   │       ├── storage/          # Zustand 状态管理
│   │       ├── services/         # 前端服务层
│   │       ├── hooks/            # React Hooks
│   │       ├── context/          # Context Providers
│   │       ├── i18n/             # 国际化
│   │       ├── styles/           # 样式文件
│   │       └── lib/              # 工具函数
│   │
│   └── open-node/                # Node.js 后端（RAG 引擎）
│       └── src/
│           ├── app.ts            # 应用入口
│           ├── api/              # REST API 端点
│           ├── services/         # 业务服务
│           ├── indexers/         # 代码索引器（tree-sitter）
│           ├── db/               # 数据库层（LevelDB, Qdrant）
│           ├── jobs/             # 后台任务队列
│           ├── types/            # TypeScript 类型定义
│           └── utils/            # 工具函数
│
├── docs/                         # 技术文档
│   ├── APP_CONFIG_USAGE.md       # 配置管理文档
│   ├── APP_EVENT_SYSTEM.md       # 事件系统文档
│   ├── APP_TAURI_COMMANDS.md     # Tauri 命令文档
│   └── APP_COLOR_PALETTE.md      # 调色板文档
│
└── openspec/                     # 项目规格说明
```

详细目录结构和命名规范请参考 [AGENTS.md](./AGENTS.md)。

## 🚀 快速开始

### 环境要求

- Rust 1.90.0+
- Node.js 18.0.0+
- pnpm 9.0.0+

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/your-repo/open-context.git
cd open-context

# 安装依赖
pnpm install

# 开发模式（启动所有组件）
pnpm dev

# 单独启动组件
pnpm dev:web       # 前端 (http://localhost:1420)
pnpm dev:server    # Node.js 服务器 (http://localhost:4500)
pnpm dev:app       # Tauri 桌面应用

# 构建
pnpm build:all     # 构建所有组件
pnpm build:web     # 构建前端
pnpm build:server  # 构建后端
pnpm build:app     # 构建桌面应用
```

### 常用命令

```bash
# 测试
cargo test --lib                  # Rust 测试
pnpm --filter open-node test      # Node.js 测试

# 运行单个测试文件
pnpm --filter open-node test workspace-service.test.ts

# 代码检查与格式化
pnpm lint                          # 检查所有代码
pnpm lint:js                       # 检查 JavaScript/TypeScript
pnpm lint:rs                       # 检查 Rust
pnpm fmt                           # 格式化所有代码
pnpm fmt:js                        # 格式化 JavaScript/TypeScript
pnpm fmt:rs                        # 格式化 Rust
```

## 📡 API 端点

Node.js 服务器运行在 `http://localhost:4500`，主要接口：

- `/workspaces/*` - 工作空间 CRUD
- `/repos/*` - 仓库管理
- `/repos/:repoId/index` - 触发索引任务
- `/query/vector` - 语义搜索
- `/query/code` - 代码搜索（向量 + 图）
- `/graph/*` - 依赖关系图查询

详细 API 文档请参考 [docs/APP_TAURI_COMMANDS.md](docs/APP_TAURI_COMMANDS.md)。

## 📚 技术文档

### 核心系统

- [持久化存储规范](./docs/APP_CONFIG_USAGE.md) - 数据存储路径规范
- [事件系统](docs/APP_EVENT_SYSTEM.md) - 前后端通信机制
- [配置管理](./docs/APP_CONFIG_USAGE.md) - 应用配置系统
- [Tauri 命令](docs/APP_TAURI_COMMANDS.md) - IPC 命令参考
- [AGENTS.md](./AGENTS.md) - AI 编码代理指南

### 子项目文档

- [Node.js 后端](./packages/open-node/README.md) - RAG 引擎、代码索引、向量检索
- [React 前端](./packages/open-web/README.md) - UI 组件、路由、状态管理

### 代码示例

- [事件系统示例](./examples/event_usage.rs)
- [配置管理示例](./examples/config_usage.rs)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📧 联系方式

- **GitHub Issues**: [提交问题](https://github.com/your-repo/open-context/issues)
- **邮箱**: michaelbguo@tencent.com
