# open-node

## Code RAG System

基于文档设计的多仓库代码 RAG 系统，支持代码语义搜索和依赖图查询。

## 架构设计

本项目实现了一个完整的代码 RAG 系统，包含：

- **向量检索**：基于 Qdrant 的语义搜索
- **依赖图**：基于 LevelDB 的代码依赖关系图
- **代码解析**：基于 tree-sitter 的 AST 解析
- **异步索引**：支持全量和增量索引

## 技术栈

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Hono
- **Vector DB**: Qdrant
- **Graph Storage**: LevelDB
- **AST Parser**: tree-sitter
- **Embedding**: OpenAI text-embedding-3-large

## 目录结构

```
admin-rag/
├─ src/
│   ├─ api/              # REST API 路由
│   ├─ services/         # 业务逻辑层
│   ├─ jobs/             # 异步任务
│   ├─ db/               # 数据持久化
│   ├─ indexers/         # 代码解析
│   ├─ utils/            # 工具函数
│   ├─ types/            # TypeScript 类型定义
│   └─ app.ts            # 启动入口
├─ data/
│   ├─ leveldb/          # LevelDB 数据
│   ├─ logs/             # 日志文件
│   └─ repos/            # Git 仓库克隆目录
├─ scripts/              # 辅助脚本
├─ tests/                # 测试文件
└─ docs/                 # 设计文档
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

必需配置：

- `QDRANT_URL`: Qdrant 服务地址
- `OPENAI_API_KEY`: OpenAI API Key

### 3. 启动 Qdrant

```bash
docker run -p 6333:6333 qdrant/qdrant
```

### 4. 启动服务

```bash
pnpm dev
```

服务将在 `http://localhost:4600` 启动。

## API 文档

详见 `docs/API接口设计.md`

### 核心接口

- `POST /api/v1/workspaces` - 创建工作空间
- `POST /api/v1/workspaces/:workspaceId/repos` - 添加仓库
- `POST /api/v1/repos/:repoId/index` - 索引仓库
- `POST /api/v1/query/code` - 代码搜索（语义+图）
- `GET /api/v1/graph/deps` - 查询依赖关系

## 开发指南

### 运行测试

```bash
pnpm test
```

### 代码格式化

```bash
pnpm fmt
```

### 类型检查

```bash
pnpm type-check
```

## 设计文档

- [目录结构设计](docs/目录结构.md)
- [数据结构设计](docs/数据结构.md)
- [API 接口设计](docs/API接口设计.md)
- [业务流程图](docs/业务流程图.md)

## 特性

- ✅ 多仓库支持
- ✅ 增量索引
- ✅ 语义搜索
- ✅ 依赖图查询
- ✅ TypeScript/JavaScript 解析
- 🚧 更多语言支持
- 🚧 WebSocket 实时推送
- 🚧 UI 界面

## License

MIT
