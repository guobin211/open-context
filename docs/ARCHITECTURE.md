# 架构设计文档

本文档描述 Open-Context 的整体架构设计和各模块职责。

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户界面层                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          React 前端 (open-web)                              │ │
│  │  - TanStack Router (路由管理)                               │ │
│  │  - Zustand (状态管理)                                       │ │
│  │  - shadcn/ui (UI 组件)                                      │ │
│  │  - Tailwind CSS (样式)                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Tauri IPC / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                      桌面应用层 (Tauri)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Rust 后端 (open-app)                               │ │
│  │  - IPC 命令系统                                             │ │
│  │  - 事件发射与监听                                            │ │
│  │  - SQLite (app.db) - 核心业务数据                           │ │
│  │  - 进程管理 (Node.js 服务)                                  │ │
│  │  - 文件系统操作                                              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────▼──────────────────────────────────────┐
│                    后端服务层 (Node.js)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │          Node.js 服务 (open-node)                           │ │
│  │  - Hono Web 框架                                            │ │
│  │  - 代码索引引擎 (tree-sitter)                                │ │
│  │  - RAG 查询引擎                                              │ │
│  │  - 文档处理 (Office/PDF/Markdown)                           │ │
│  │  - 任务队列 (BullMQ)                                         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SQLite     │  │  SurrealDB   │  │   Qdrant     │
│   app.db     │  │  符号+图+搜索 │  │  向量检索     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 模块职责

### 1. 前端层 (open-web)

**职责**：

- 用户界面渲染
- 用户交互处理
- 状态管理
- 路由导航

**技术栈**：

- React 19.x
- TanStack Router
- Zustand
- shadcn/ui + Tailwind CSS

**主要模块**：

- `routes/` - 页面路由
- `components/` - UI 组件
- `zustand/` - 状态存储
- `hooks/` - 自定义 hooks

---

### 2. 桌面应用层 (open-app)

**职责**：

- 提供桌面应用外壳
- 处理系统级操作（文件、窗口、菜单）
- 管理 SQLite 数据库
- 启动和管理 Node.js 后端服务
- IPC 通信桥接

**技术栈**：

- Tauri 2.x
- Rust 1.x
- rusqlite

**主要模块**：

- `app_command/` - IPC 命令处理
- `app_events/` - 事件系统
- `app_service/` - 业务服务
- `app_state/` - 应用状态

**数据存储**：

- `app.db` (SQLite) - 工作空间、笔记、文件、链接、仓库、会话等

---

### 3. 后端服务层 (open-node)

**职责**：

- 代码仓库索引
- 符号提取和分析
- 向量嵌入生成
- 图关系构建
- RAG 查询处理
- 文档解析（Office/PDF/Markdown/HTML）
- 图像 OCR 识别
- 任务队列管理

**技术栈**：

- Node.js 20.x
- Hono 4.x
- tree-sitter (代码解析)
- LangChain (AI 集成)

**主要模块**：

- `api/` - HTTP API 路由
- `services/` - 业务服务
- `indexers/` - 索引引擎
- `db/` - 数据库操作
- `jobs/` - 后台任务

**数据存储**：

- `SurrealDB` - 符号、图关系、全文检索
- `Qdrant` - 向量嵌入、语义检索

---

## 数据流

### 1. 用户操作流

```
用户操作 → React 前端 → Tauri IPC → Rust 后端 → SQLite
                                         ↓
                                    发送事件
                                         ↓
                                    前端更新 UI
```

### 2. 代码索引流

```
添加仓库 → Tauri → Node.js 服务
                      ↓
                 Git Clone/Pull
                      ↓
                 AST 解析 (tree-sitter)
                      ↓
                 符号提取
                      ↓
        ┌─────────────┴─────────────┐
        ▼                           ▼
   生成嵌入向量                  构建依赖图
        ↓                           ↓
   存储到 Qdrant              存储到 SurrealDB
        │                           │
        └─────────────┬─────────────┘
                      ▼
              更新索引状态到 app.db
                      ▼
              发送完成事件到前端
```

### 3. RAG 查询流

```
用户提问 → 前端 → Node.js 服务
                      ↓
                 查询嵌入向量
                      ↓
                 Qdrant 语义检索
                      ↓
                 Top-K 符号
                      ↓
                 SurrealDB 图扩展
                      ↓
                 合并上下文
                      ↓
                 LLM 生成答案
                      ↓
                 返回给前端
```

---

## 通信机制

### IPC 通信 (前端 ↔ Tauri)

```typescript
// 前端调用 Tauri 命令
import { invoke } from '@tauri-apps/api/core';

const workspaces = await invoke<Workspace[]>('get_all_workspaces');

// 前端监听 Tauri 事件
import { listen } from '@tauri-apps/api/event';

await listen('task:completed', (event) => {
  console.log('Task completed:', event.payload);
});

// Rust 发送事件
app.emit("task:completed", payload)?;
```

### HTTP 通信 (Tauri ↔ Node.js)

```typescript
// Tauri 调用 Node.js API
const response = await fetch('http://localhost:4500/api/v1/repos/index', {
  method: 'POST',
  body: JSON.stringify({ repoId: 'repo-123' })
});

// Node.js 返回响应
app.post('/api/v1/repos/index', async (c) => {
  const { repoId } = await c.req.json();
  const jobId = await indexerService.startIndexJob(repoId);
  return c.json({ jobId });
});
```

### WebSocket 通信 (实时更新)

```typescript
// 前端连接 WebSocket
const ws = new WebSocket('ws://localhost:4500/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 处理实时消息
};

// Node.js 推送更新
wsServer.broadcast(
  JSON.stringify({
    type: 'index:progress',
    data: { repoId, progress: 50 }
  })
);
```

---

## 存储架构

### 数据分层

| 层级       | 数据库          | 访问方式        | 数据类型                               |
| ---------- | --------------- | --------------- | -------------------------------------- |
| **应用层** | SQLite (app.db) | Tauri + Node.js | 工作空间、笔记、文件、链接、仓库元数据 |
| **知识层** | SurrealDB       | Node.js         | 代码符号、依赖关系、全文索引           |
| **向量层** | Qdrant          | Node.js         | 代码嵌入向量、语义检索                 |

### 数据同步

- **双向同步**：app.db 的索引状态和元数据由 Tauri 和 Node.js 共同维护
- **单向写入**：SurrealDB 和 Qdrant 仅由 Node.js 写入
- **事件通知**：数据变更通过事件系统通知前端更新

---

## 扩展性设计

### 插件系统（规划中）

```
plugins/
├── indexers/          # 自定义索引器
├── extractors/        # 自定义提取器
├── embeddings/        # 自定义嵌入模型
└── tools/             # 自定义工具
```

### AI 集成

- **LangChain**：统一 AI 框架接口
- **Ollama**：本地 LLM 支持
- **可扩展模型**：支持 OpenAI、Anthropic、本地模型等

---

## 性能优化

### 索引优化

1. **增量索引**：仅处理变更文件
2. **并行处理**：多文件并行解析
3. **缓存机制**：文件 hash 缓存避免重复处理
4. **批量写入**：批量插入向量和符号

### 查询优化

1. **向量预过滤**：使用 payload 索引过滤
2. **图查询限深**：限制遍历深度避免性能问题
3. **缓存热数据**：缓存常用查询结果
4. **分页加载**：大结果集分页返回

### 数据库优化

1. **SQLite WAL 模式**：支持并发读写
2. **SurrealDB 索引**：为常用字段创建索引
3. **Qdrant Payload 索引**：优化过滤性能

---

## 安全性

### 数据隔离

- 工作空间级别隔离
- 用户权限控制（规划中）

### 本地优先

- 数据存储在本地
- 无需云服务依赖
- 可选同步功能（规划中）

---

## 部署架构

### 开发模式

```
pnpm dev → 启动所有服务
├── Vite Dev Server (前端) - localhost:1420
├── Tauri Dev (桌面应用)
└── Node.js Server (后端) - localhost:4500
```

### 生产模式

```
Tauri Bundle
├── 内嵌 Web 资源（构建后）
├── Rust 二进制
└── 内嵌 Node.js 服务（sidecar）
```

---

## 技术选型理由

### 为什么选择 Tauri？

- 轻量级（相比 Electron）
- Rust 高性能
- 原生系统集成
- 安全性高

### 为什么选择 SurrealDB？

- 原生图数据库支持
- BM25 全文检索
- 嵌入式模式
- SQL-like 查询语法

### 为什么选择 Qdrant？

- 高性能向量检索
- Payload 过滤
- 易于集成
- 开源免费

### 为什么选择 tree-sitter？

- 多语言支持
- 增量解析
- 容错性强
- 活跃社区

---

## 未来规划

### 短期目标

- [ ] 完善代码索引引擎
- [ ] 优化 RAG 查询性能
- [ ] 支持更多编程语言
- [ ] 文档处理增强

### 中期目标

- [ ] 插件系统
- [ ] 多用户支持
- [ ] 云同步功能
- [ ] 移动端支持（Web 版）

### 长期目标

- [ ] 分布式索引
- [ ] 企业版功能
- [ ] AI Agent 自动化
- [ ] 多模态支持（图片、音频、视频）

---

## 参考文档

- [技术栈文档](./TECH_STACK.md)
- [数据库架构](./DATABASE_SCHEMA.md)
- [Tauri 端文档](./APP_TAURI.md)
- [Node.js 后端文档](./NODE_BACKEND.md)
- [共享存储规范](./SHARED_STORAGE.md)
