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
- 🌐 **AI 集成** - Copilot 智能输入、语音输入、多工作区协作
- 🔄 **事件系统** - 完整的前后端通信机制
- ⚙️ **高度可配置** - 丰富的设置选项、主题定制、快捷键映射

## 🏗️ 项目架构

Open-Context 是一个基于 Tauri 的混合桌面应用，采用 Rust + TypeScript + Node.js 三层架构：

| 模块                   | 职责                                        | 技术栈                  |
| ---------------------- | ------------------------------------------- | ----------------------- |
| **tauri** (`open-app`) | 客户端桌面应用的壳，负责桌面相关的 API 操作 | Rust + Tauri            |
| **open-node**          | 后台服务，负责构建索引、文件处理等后台任务  | Node.js + Hono          |
| **open-web**           | React 编写的 Web 端 UI，提供用户界面        | React + TanStack Router |

详细架构和代码规范请参考 [AGENTS.md](./AGENTS.md)。

## 📦 项目结构

```
open-context/
├── apps/
│   ├── open-app/          # Tauri 桌面应用 (Rust)
│   ├── open-node/         # Node.js 后台服务 → 📖 [文档](./apps/open-node/README.md)
│   └── open-web/          # React 前端应用 → 📖 [文档](./apps/open-web/README.md)
├── docs/                  # 技术文档
│   ├── SHARED_STORAGE.md  # 共享存储规范
│   ├── APP_TAURI.md       # Tauri 端文档（命令、事件、异步任务）
│   └── NODE_BACKEND.md    # Node.js 后端文档（API、数据模型、RAG 系统）
├── AGENTS.md              # AI 编码代理指南
├── CLAUDE.md              # Claude 专用指南
└── README.md              # 本文件
```

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
```

更多命令请参考 [AGENTS.md - 命令](./AGENTS.md#命令)。

## 📚 技术文档

### 核心系统文档

| 文档                                          | 说明                                             |
| --------------------------------------------- | ------------------------------------------------ |
| [📖 共享存储规范](./docs/SHARED_STORAGE.md)   | 数据存储路径规范、配置管理、目录结构             |
| [📖 Tauri 端文档](./docs/APP_TIRI.md)         | Tauri 命令、事件系统、异步任务模式、数据类型定义 |
| [📖 Node.js 后端文档](./docs/NODE_BACKEND.md) | API 设计、数据模型、RAG 系统、向量/图数据库架构  |

### 开发指南

| 文档                              | 说明                                   |
| --------------------------------- | -------------------------------------- |
| [📖 AI 编码代理指南](./AGENTS.md) | 项目架构、代码规范、开发流程、命令参考 |
| [📖 Claude 专用指南](./CLAUDE.md) | Claude AI 的特定开发指导               |

### 子项目文档

| 项目                                          | 说明                                   |
| --------------------------------------------- | -------------------------------------- |
| [📖 Node.js 后端](./apps/open-node/README.md) | RAG 引擎、代码索引、向量检索、业务流程 |
| [📖 React 前端](./apps/open-web/README.md)    | UI 组件、路由、状态管理、技术栈        |

## 🛠️ 开发指南

### 代码规范

本项目使用统一的编码规范，详见：

- 各 AI 工具配置：`.claude/rules/coding.md`、`.opencode/rules/coding.md`、`.codebuddy/rules/coding.md`
- 完整架构和规范：[AGENTS.md](./AGENTS.md)

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
