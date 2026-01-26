# open-node

## Node.js 后端服务

基于 RAG（检索增强生成）的代码理解系统，支持多仓库代码语义搜索和依赖图查询。

## 架构设计

本项目实现了一个完整的代码 RAG 系统，包含：

- **向量检索**：基于 Qdrant 的语义搜索
- **依赖图**：基于 Keyv + SQLite 的代码依赖关系图
- **代码解析**：基于 tree-sitter 的 AST 解析
- **异步索引**：支持全量和增量索引

## 技术栈

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Hono
- **Vector DB**: Qdrant（向量存储）
- **Graph DB**: SurrealDB（图数据库）
- **Graph Storage**: LevelDB（符号、依赖关系）
- **Task Queue**: BullMQ（异步任务）
- **AST Parser**: tree-sitter
- **Embedding**: OpenAI / Ollama

## 目录结构

```
open-node/
├─ src/
│   ├─ api/              # REST API 路由
│   ├─ services/         # 业务逻辑层
│   ├─ jobs/             # 异步任务（BullMQ）
│   ├─ db/               # 数据持久化
│   ├─ indexers/         # 代码解析（tree-sitter）
│   ├─ utils/            # 工具函数
│   ├─ types/            # TypeScript 类型定义
│   └─ app.ts            # 启动入口
├─ tests/                # 测试文件
├─ package.json
├─ tsconfig.json
└─ vitest.config.ts
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# Qdrant 向量数据库
QDRANT_URL=http://localhost:6333

# OpenAI Embedding（或使用 Ollama）
OPENAI_API_KEY=your-api-key

# SurrealDB 图数据库（自动创建）
SURREALDB_URL=file://~/.open-context/database/surrealdb/data
```

### 3. 启动 Qdrant（可选）

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. 启动服务

```bash
# 开发模式
pnpm dev

# 或从根目录启动
pnpm dev:server
```

服务将在 `http://localhost:4500` 启动。

## API 文档

详见 [Node.js 后端文档](../../docs/NODE_BACKEND.md)

### 核心接口

- `POST /api/v1/workspaces` - 创建工作空间
- `POST /api/v1/workspaces/:workspaceId/repos` - 添加仓库
- `POST /api/v1/repos/:repoId/index` - 全量索引仓库
- `POST /api/v1/repos/:repoId/reindex` - 增量索引仓库
- `POST /api/v1/query/vector` - 向量语义查询
- `POST /api/v1/query/code` - 联合查询（语义+图）
- `GET /api/v1/graph/deps` - 查询依赖关系
- `GET /api/v1/jobs/:jobId` - 查询任务状态

## 开发命令

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 监听模式运行测试
pnpm test:watch

# 测试 UI 模式
pnpm test:ui

# 生成覆盖率报告
pnpm test:coverage

# 类型检查
pnpm type-check
```

## 数据存储

详见 [共享存储规范](../../docs/SHARED_STORAGE.md)

### 存储路径

```
~/.open-context/
├── database/
│   ├── surrealdb/          # SurrealDB 图数据库
│   ├── leveldb/            # LevelDB 符号存储
│   │   ├── main/           # 符号元数据
│   │   ├── edges/          # 正向边
│   │   └── reverse-edges/  # 反向边
│   └── qdrant/             # Qdrant 向量数据库（需独立部署）
└── workspace/
    └── repos/              # Git 仓库克隆目录
```

### 存储方案

| 数据库        | 用途                             | 技术栈    |
| ------------- | -------------------------------- | --------- |
| **SurrealDB** | 图数据库（实体、关系）           | SurrealDB |
| **LevelDB**   | 符号元数据、依赖关系（键值存储） | LevelDB   |
| **Qdrant**    | 向量嵌入（语义搜索）             | Qdrant    |

## 特性

- ✅ 多仓库支持
- ✅ 增量索引
- ✅ 语义搜索（向量相似度）
- ✅ 依赖图查询（关系遍历）
- ✅ TypeScript/JavaScript 解析
- ✅ 异步任务队列
- 🚧 更多语言支持（Bash, CSS, HTML, JSON 解析器已安装）
- 🚧 WebSocket 实时推送

## 代码规范

详见 [AGENTS.md](../../AGENTS.md) 中的 Node.js 服务部分：

- **命名规范**：kebab-case 文件名（`workspace-service.ts`）
- **导入规范**：相对导入（`import { logger } from '../utils'`）
- **返回类型**：`Promise<T | null>` 查询单个，`T[]` 查询列表
- **日志规范**：pino 结构化日志 `logger.info({ id }, 'Message')`
- **错误处理**：自然传播错误，返回 `null` 表示未找到

## 相关文档

- **[Node.js 后端文档](../../docs/NODE_BACKEND.md)** - API 设计、数据模型、RAG 系统架构
- **[共享存储规范](../../docs/SHAREDStorage.md)** - 数据存储路径规范
- **[AGENTS.md](../../AGENTS.md)** - 代码规范和开发指南

## License

MIT
