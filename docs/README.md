# Open-Context 文档索引

欢迎查阅 Open-Context 项目文档！本索引将帮助您快速找到需要的文档。

## 📚 快速导航

### 新手入门

1. [项目概览](../README.md) - 了解项目特性和快速开始
2. [技术栈概览](./TECH_STACK.md) - 熟悉使用的技术栈

### 开发指南

- [AI 编码代理指南](../AGENTS.md) - 项目架构、代码规范、开发流程
- [Claude 专用指南](../CLAUDE.md) - Claude AI 特定开发指导

### 模块文档

#### 前端开发

- [React 前端文档](../apps/open-web/README.md) - UI 组件、路由、状态管理

#### 桌面应用

- [Tauri 端文档](./APP_TAURI.md) - IPC 命令、事件系统、异步任务

#### 后端服务

- [Node.js 后端文档](./NODE_BACKEND.md) - API 设计、RAG 系统、索引引擎
- [Node.js 服务详细文档](../apps/open-node/README.md) - 业务逻辑实现

### 数据与存储

- [数据库架构](./DATABASE_SCHEMA.md) - 数据库表结构、索引、查询示例
- [共享存储规范](./SHARED_STORAGE.md) - 文件存储路径、配置管理

---

## 📖 文档详情

### [ARCHITECTURE.md](./ARCHITECTURE.md)

**架构设计文档**

了解 Open-Context 的整体架构设计和各模块职责。

**内容**：

- 系统架构图
- 模块职责划分
- 数据流设计
- 通信机制（IPC、HTTP、WebSocket）
- 存储架构
- 性能优化策略
- 未来规划

**适合人群**：

- 新加入项目的开发者
- 需要理解系统设计的贡献者
- 架构设计者

---

### [TECH_STACK.md](./TECH_STACK.md)

**技术栈概览文档**

详细列出项目使用的所有技术栈和依赖库。

**内容**：

- 前端技术栈（React、TanStack Router、Zustand）
- 桌面端技术栈（Tauri、Rust）
- 后端技术栈（Node.js、Hono、LangChain）
- 数据库（SQLite、SurrealDB、Qdrant）
- 开发工具链
- 运行时要求

**适合人群**：

- 需要了解项目依赖的开发者
- 准备搭建开发环境的新手
- 技术选型参考

---

### [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

**数据库架构文档**

详细说明所有数据库的表结构、索引和查询示例。

**内容**：

- 数据类型分类（原子类型、界面类型、复合类型）
- SQLite (app.db) 表结构
- SurrealDB 符号和图关系表
- Qdrant 向量数据结构
- 性能优化建议
- ER 关系图

**适合人群**：

- 数据库设计者
- 需要查询数据的开发者
- 性能优化工程师

---

### [SHARED_STORAGE.md](./SHARED_STORAGE.md)

**共享存储规范文档**

定义统一的文件存储路径和配置管理规范。

**内容**：

- 存储根目录规范
- 目录结构定义
- 配置文件格式
- 路径拼接方法（TypeScript、Node.js、Rust）
- 目录初始化

**适合人群**：

- 需要访问文件系统的开发者
- 配置管理相关开发
- 多端协同开发

---

### [APP_TAURI.md](./APP_TAURI.md)

**Tauri 桌面端文档**

详细说明 Tauri 端的 IPC 命令、事件系统和异步任务模式。

**内容**：

- 架构概述
- IPC 命令定义（工作空间、笔记、文件、仓库）
- 数据类型定义
- 事件系统（发送、监听、封装）
- 异步任务模式
- 数据库表结构
- 最佳实践

**适合人群**：

- Tauri/Rust 开发者
- 需要调用系统 API 的开发者
- 前端与桌面通信开发

---

### [NODE_BACKEND.md](./NODE_BACKEND.md)

**Node.js 后端服务文档**

详细说明后端服务的 API 设计、数据模型和 RAG 系统。

**内容**：

- 架构概述
- API 设计（Workspace、Repository、Index、Query、Graph）
- 数据模型（核心实体层级）
- 向量数据库（Qdrant）配置和查询
- 图数据库（SurrealDB）配置和查询
- 索引流程
- RAG 查询流程
- 代码示例

**适合人群**：

- Node.js 后端开发者
- RAG 系统开发者
- API 调用者

---

## 🔍 按场景查找

### 场景 1：我想添加新的数据库表

1. 查看 [数据库架构](./DATABASE_SCHEMA.md) 了解现有表结构
2. 根据数据类型选择合适的数据库（SQLite/SurrealDB/Qdrant）
3. 参考 [Tauri 端文档](./APP_TAURI.md) 或 [Node.js 后端文档](./NODE_BACKEND.md) 实现数据访问

### 场景 2：我想添加新的 API 接口

1. 查看 [Node.js 后端文档](./NODE_BACKEND.md) 了解 API 设计规范
2. 参考 [架构设计](./ARCHITECTURE.md) 理解数据流
3. 实现并更新 API 文档

### 场景 3：我想添加新的 IPC 命令

1. 查看 [Tauri 端文档](./APP_TAURI.md) 了解命令定义方式
2. 在 Rust 端实现命令处理函数
3. 在前端调用新命令
4. 更新文档

### 场景 4：我想优化数据库查询性能

1. 查看 [数据库架构](./DATABASE_SCHEMA.md) 的性能优化章节
2. 检查索引配置
3. 使用批量操作和事务
4. 考虑缓存策略

### 场景 5：我想集成新的 AI 模型

1. 查看 [技术栈概览](./TECH_STACK.md) 了解当前 AI 集成方式
2. 使用 LangChain 统一接口
3. 参考 [Node.js 后端文档](./NODE_BACKEND.md) 的 RAG 查询流程
4. 实现并测试

---

## 📝 文档贡献

如果您发现文档有错误或需要补充，欢迎贡献：

1. Fork 项目
2. 修改相关文档
3. 提交 Pull Request
4. 在 PR 描述中说明修改内容

### 文档编写规范

- 使用 Markdown 格式
- 添加目录和导航链接
- 提供代码示例
- 保持简洁清晰
- 及时更新

---

## 🔗 外部资源

### 技术文档

- [Tauri 官方文档](https://tauri.app/zh-cn/)
- [React 官方文档](https://react.dev/)
- [TanStack Router](https://tanstack.com/router)
- [SurrealDB 文档](https://surrealdb.com/docs)
- [Qdrant 文档](https://qdrant.tech/documentation/)
- [tree-sitter 文档](https://tree-sitter.github.io/tree-sitter/)
- [LangChain 文档](https://js.langchain.com/docs/)

### 社区

- [GitHub Issues](https://github.com/guobin211/open-context/issues)
- [GitHub Discussions](https://github.com/guobin211/open-context/discussions)

---

## 📞 获取帮助

- 📖 查阅本文档索引
- 🐛 [提交 Issue](https://github.com/guobin211/open-context/issues)
- 💬 [参与讨论](https://github.com/guobin211/open-context/discussions)

---

**文档版本**：v0.1.0  
**最后更新**：2026-01-27
