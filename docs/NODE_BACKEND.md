# Node.js 后端技术文档

本文档描述 Open-Context 的 Node.js 后端服务（open-node），包括 API 设计、数据模型、RAG 系统和业务流程。

> **存储路径**：参见 [共享存储规范](./SHARED_STORAGE.md)

## 架构概述

```
┌─────────────────────────────────────────┐
│              API Layer                  │
│  src/api/                               │
│  ├─ workspace-routes.ts                 │
│  ├─ repo-routes.ts                      │
│  ├─ index-routes.ts                     │
│  ├─ query-routes.ts                     │
│  └─ graph-routes.ts                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│            Service Layer                │
│  src/services/                          │
│  ├─ workspace-service.ts                │
│  ├─ repo-service.ts                     │
│  ├─ indexer-service.ts                  │
│  ├─ vector-service.ts                   │
│  ├─ graph-service.ts                    │
│  └─ rag-service.ts                      │
└───────┬───────────────┬─────────────────┘
        │               │
        ▼               ▼
┌───────────────┐   ┌───────────────────┐
│   Qdrant       │    │   Graph System     │
│  (Vectors)     │    │  SurrealDB         │
│                │    │                    │
└───────────────┘   └───────────────────┘
```

---

## 一、API 设计

### 基础约定

- Base URL：`/api/v1`
- Content-Type：`application/json`
- ID 格式：`uuid`
- 异步任务：返回 `jobId`

### Workspace API

```
GET    /api/v1/workspaces              # 列表
GET    /api/v1/workspaces/{id}         # 详情
POST   /api/v1/workspaces              # 创建
DELETE /api/v1/workspaces/{id}         # 删除
```

### Repository API

```
GET    /api/v1/workspaces/{wsId}/repos           # 列表
POST   /api/v1/workspaces/{wsId}/repos           # 创建
DELETE /api/v1/workspaces/{wsId}/repos/{repoId}  # 删除
```

### 索引 API

```
POST   /api/v1/repos/{repoId}/index    # 全量索引
POST   /api/v1/repos/{repoId}/reindex  # 增量索引
GET    /api/v1/jobs/{jobId}            # 任务状态
```

### 查询 API

```
POST   /api/v1/query/vector   # 向量语义查询
POST   /api/v1/query/code     # 向量 + 图联合查询
GET    /api/v1/graph/deps     # 依赖查询
GET    /api/v1/graph/reverse-deps  # 反向依赖
GET    /api/v1/graph/traverse      # 多跳遍历
```

---

## 二、数据模型

### 核心实体层级

```
Workspace
 └─ Repository
     └─ File
         └─ Symbol
             └─ Relation
```

### Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
}
```

### Repository

```typescript
interface Repository {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  defaultBranch: string;
  lastIndexedCommit: string;
  indexedAt: number;
}
```

### File

```typescript
interface File {
  id: string;
  repoId: string;
  path: string;
  language: string;
  size: number;
  checksum: string;
  lastModifiedCommit: string;
}
```

### Symbol（RAG 核心单元）

```typescript
interface Symbol {
  id: string;
  repoId: string;
  fileId: string;
  name: string;
  qualifiedName: string;
  kind: 'function' | 'class' | 'method' | 'interface' | 'type';
  visibility: 'public' | 'private' | 'protected';
  exported: boolean;
  location: { startLine: number; endLine: number };
  signature?: string;
  docComment?: string;
  codeChunk: string;
}
```

### Relation

```typescript
interface Relation {
  id: string;
  fromSymbolId: string;
  toSymbolId?: string;
  type: 'IMPORTS' | 'CALLS' | 'IMPLEMENTS' | 'EXTENDS' | 'USES' | 'REFERENCES';
  confidence: number; // 0-1
}
```

---

## 三、向量数据库（Qdrant）

### Collection 配置

```json
{
  "collection": "code_symbols",
  "vectors": {
    "code": { "size": 3072, "distance": "Cosine" }
  }
}
```

### Point Payload 结构

```typescript
interface SymbolPayload {
  workspace_id: string;
  repo_id: string;
  repo_name: string;
  file_path: string;
  language: string;
  symbol_id: string;
  symbol_name: string;
  symbol_kind: string;
  exported: boolean;
  visibility: string;
  code: string;
  signature?: string;
  importance: number;
  commit: string;
  indexed_at: number;
}
```

### 必需索引

```typescript
const indexes = [
  { field_name: 'workspace_id', field_schema: 'keyword' },
  { field_name: 'repo_id', field_schema: 'keyword' },
  { field_name: 'symbol_kind', field_schema: 'keyword' },
  { field_name: 'exported', field_schema: 'bool' },
  { field_name: 'language', field_schema: 'keyword' }
];
```

### 查询示例

```typescript
// 基础语义查询
await client.search('code_symbols', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [{ key: 'workspace_id', match: { value: workspaceId } }]
  }
});

// 限定仓库查询
filter: {
  must: [
    { key: 'workspace_id', match: { value: workspaceId } },
    { key: 'repo_id', match: { any: repoIds } }
  ];
}
```

---

## 四、图数据库（SurrealDB）

### 技术栈

- **库**：`@surrealdb/node` (1.0.0-beta.3)
- **存储模式**：嵌入式文件存储 / 服务器模式
- **数据路径**：`~/.open-context/database/surrealdb/`

### 连接配置

```typescript
import Surreal from '@surrealdb/node';

const db = new Surreal();

// 嵌入式模式（推荐）
await db.connect('file://~/.open-context/database/surrealdb/data.db');

// 服务器模式
// await db.connect('http://localhost:8000');
// await db.signin({ username: 'root', password: 'root' });

await db.use({ namespace: 'code_index', database: 'open_context' });
```

### 数据模型

#### symbols 表

```sql
DEFINE TABLE symbols SCHEMAFULL;

DEFINE FIELD symbol_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD workspace_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD repo_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD file_path ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD symbol_name ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD symbol_kind ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD code ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD language ON symbols TYPE string ASSERT $value != NONE;

-- 索引
DEFINE INDEX symbol_id_idx ON symbols FIELDS symbol_id UNIQUE;
DEFINE INDEX workspace_repo_idx ON symbols FIELDS workspace_id, repo_id;

-- 全文搜索索引
DEFINE INDEX symbol_name_search ON symbols FIELDS symbol_name SEARCH ANALYZER simple BM25;
DEFINE INDEX code_search ON symbols FIELDS code SEARCH ANALYZER simple BM25;
```

#### 关系表

```sql
-- IMPORTS/CALLS/IMPLEMENTS/EXTENDS/USES/REFERENCES
DEFINE TABLE calls SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON calls TYPE number DEFAULT 1.0;
DEFINE FIELD created_at ON calls TYPE number DEFAULT time::now();
```

### 图查询示例

```typescript
// 查找某个符号调用的所有函数
const calls = await db.query(
  `
  SELECT ->calls->symbols.* AS called_functions
  FROM symbols WHERE symbol_id = $symbolId
`,
  { symbolId }
);

// 查找调用链（2层深度）
const callChain = await db.query(
  `
  SELECT 
    ->calls->symbols AS level1,
    ->calls->symbols->calls->symbols AS level2
  FROM symbols WHERE symbol_id = $symbolId
`,
  { symbolId }
);

// 查找反向依赖（谁调用了这个函数）
const callers = await db.query(
  `
  SELECT <-calls<-symbols.* AS caller_functions
  FROM symbols WHERE symbol_id = $symbolId
`,
  { symbolId }
);

// 全文搜索
const searchResults = await db.query(
  `
  SELECT *, search::score(1) AS relevance
  FROM symbols
  WHERE workspace_id = $workspaceId
    AND (symbol_name @1@ $query OR code @1@ $query)
  ORDER BY relevance DESC
  LIMIT 20
`,
  { workspaceId, query: 'authentication' }
);
```

---

## 五、索引流程

```
┌────────────────────────┐
│   POST /repos/:id/index │
└────────────┬───────────┘
             ▼
┌────────────────────────┐
│   Git Clone / Pull     │
└────────────┬───────────┘
             ▼
┌────────────────────────┐
│   AST Parse            │
│   (tree-sitter)        │
└────────────┬───────────┘
             ▼
┌────────────────────────┐
│   Symbol Extract       │
│   - function           │
│   - class              │
│   - method             │
│   - interface          │
└────────────┬───────────┘
             │
     ┌───────┴─────────┐
     ▼                 ▼
┌───────────────┐   ┌───────────────┐
│  Embedding    │   │  Graph Build  │
│  → Qdrant     │   │  → SurrealDB  │
└───────────────┘   └───────────────┘
```

### 增量更新策略

- **向量更新**：基于 `content_hash` 判断文件是否变化
- **图更新**：删除旧符号及其关系，重建新符号和关系
- **优化**：仅处理 Git diff 中变化的文件

---

## 六、RAG 查询流程

```
┌──────────────────────────┐
│   User Query             │
│ "token 是怎么校验的？"    │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  Qdrant Semantic Search  │
│  Top-K Symbols           │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  Graph Expansion         │
│  CALLS / IMPORTS         │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│  Context Builder         │
│  Deduplicate + Merge     │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│        LLM Response      │
└──────────────────────────┘
```

### 联合查询 API

```
POST /api/v1/query/code
{
  "workspaceId": "ws_123",
  "query": "where is token verified",
  "expandGraph": {
    "type": "CALLS",
    "depth": 1
  }
}
```

---

## 七、代码示例

### SurrealDB 操作

```typescript
import Surreal from '@surrealdb/node';

const db = new Surreal();
await db.connect('file://~/.open-context/database/surrealdb/data.db');
await db.use({ namespace: 'code_index', database: 'open_context' });

// 插入符号
const [symbol] = await db.create('symbols', {
  symbol_id: 'sym_123',
  workspace_id: 'ws_456',
  repo_id: 'repo_789',
  symbol_name: 'getUserInfo',
  symbol_kind: 'function',
  code: 'function getUserInfo() { ... }',
  language: 'typescript',
  file_path: '/src/user.ts'
});

// 创建调用关系
await db.query(
  `
  RELATE (symbols WHERE symbol_id = $from)->calls->(symbols WHERE symbol_id = $to)
  SET confidence = 1.0, created_at = time::now()
`,
  { from: 'sym_123', to: 'sym_456' }
);

// 查询符号
const symbols = await db.query(
  `
  SELECT * FROM symbols
  WHERE workspace_id = $wsId AND symbol_kind = $kind
  LIMIT 20
`,
  { wsId: 'ws-123', kind: 'function' }
);

// 更新符号
await db.merge('symbols:sym_123', {
  importance: 0.9,
  updated_at: Date.now()
});

// 删除仓库的所有数据
await db.query(
  `
  DELETE FROM symbols WHERE repo_id = $repoId;
  DELETE FROM calls WHERE in.repo_id = $repoId OR out.repo_id = $repoId;
`,
  { repoId: 'repo-456' }
);

// 全文搜索
const results = await db.query(
  `
  SELECT *, search::score(1) AS relevance
  FROM symbols
  WHERE symbol_name @1@ $query
  ORDER BY relevance DESC
  LIMIT 20
`,
  { query: 'authentication' }
);
```

### Qdrant 操作

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({ url: 'http://localhost:6333' });

// 插入向量
await client.upsert('code_symbols', {
  points: [
    {
      id: 'sym_123',
      vector: embedding, // [1024]维向量
      payload: {
        workspace_id: 'ws_456',
        repo_id: 'repo_789',
        symbol_id: 'sym_123',
        symbol_name: 'getUserInfo',
        symbol_kind: 'function',
        language: 'typescript',
        file_path: '/src/user.ts',
        exported: true,
        code: 'function getUserInfo() { ... }'
      }
    }
  ]
});

// 语义搜索
const results = await client.search('code_symbols', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [
      { key: 'workspace_id', match: { value: 'ws_456' } },
      { key: 'symbol_kind', match: { any: ['function', 'method'] } }
    ]
  }
});

// 删除仓库的所有向量
await client.delete('code_symbols', {
  filter: {
    must: [{ key: 'repo_id', match: { value: 'repo_789' } }]
  }
});
```

---

## 八、模块映射

| API 路径             | 服务模块               |
| -------------------- | ---------------------- |
| `/workspaces`        | `workspace-service.ts` |
| `/repos`             | `repo-service.ts`      |
| `/index`, `/reindex` | `indexer-service.ts`   |
| `/query/vector`      | `qdrant-service.ts`    |
| `/graph/*`           | `graph-service.ts`     |
| `/jobs`              | `job-service.ts`       |

---

## 九、设计原则

1. **Symbol 是最小认知单元**：RAG 索引以 Symbol 为粒度
2. **Relation 是图价值来源**：不超过 6 种关系类型
3. **Repo 是隔离边界**：跨仓库使用软关联
4. **Qdrant 负责语义**：向量相似度搜索
5. **Graph 负责结构**：依赖关系遍历
6. **职责分离**：向量系统不知道关系，图系统不知道语义
