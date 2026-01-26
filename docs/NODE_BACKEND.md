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
│   Qdrant      │   │   Graph System    │
│  (Vectors)    │   │  SurrealDB +      │
│               │   │  LevelDB          │
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

## 四、图数据库（SurrealDB + LevelDB）

### SurrealDB 配置

```typescript
// 命名空间和数据库
NAMESPACE: open_context
DATABASE: code_graph

// 存储路径
~/.open-context/database/surrealdb/
```

### 表结构

#### symbols 表

```sql
DEFINE TABLE symbols SCHEMAFULL;
DEFINE FIELD symbol_id ON symbols TYPE string;
DEFINE FIELD workspace_id ON symbols TYPE string;
DEFINE FIELD repo_id ON symbols TYPE string;
DEFINE FIELD file_path ON symbols TYPE string;
DEFINE FIELD symbol_name ON symbols TYPE string;
DEFINE FIELD symbol_kind ON symbols TYPE string;
DEFINE FIELD code ON symbols TYPE string;

-- 全文搜索索引
DEFINE INDEX symbol_name_search ON symbols FIELDS symbol_name SEARCH ANALYZER BM25;
DEFINE INDEX code_search ON symbols FIELDS code SEARCH ANALYZER BM25;
```

#### relations 表

```sql
DEFINE TABLE relations SCHEMAFULL;
DEFINE FIELD from_symbol_id ON relations TYPE string;
DEFINE FIELD to_symbol_id ON relations TYPE string;
DEFINE FIELD relation_type ON relations TYPE string;
DEFINE FIELD confidence ON relations TYPE number;

DEFINE INDEX from_to ON relations COLUMNS from_symbol_id, to_symbol_id UNIQUE;
```

### 图查询示例

```sql
-- 查找依赖
SELECT to_symbol_id, relation_type, confidence
FROM relations
WHERE from_symbol_id = $symbol_id AND relation_type = 'CALLS';

-- 图遍历（2层深度）
CALL graph::traverse($from_id, 'outbound', { relation_type: 'CALLS' }, null, 2)
RETURN path;
```

### LevelDB 存储结构

```
~/.open-context/database/leveldb/
├── main/           # 符号元数据
├── edges/          # 正向边 edge:<from>:<type> -> [to1, to2]
└── reverse-edges/  # 反向边 redge:<to>:<type> -> [from1, from2]
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
└────────────┬───────────┘
             │
     ┌───────┴─────────┐
     ▼                 ▼
┌───────────────┐   ┌───────────────┐
│  Embedding    │   │  Graph Build  │
│  → Qdrant     │   │  → SurrealDB  │
└───────────────┘   │  → LevelDB    │
                    └───────────────┘
```

### 增量更新策略

- **向量**：基于 `symbol_id + commit` 判断是否更新
- **图**：文件级删除重建（删旧边 → 写新边）

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

## 七、SurrealDB 使用

### 初始化

```typescript
import Surreal from '@surrealdb/node';

const db = new Surreal();
await db.connect('file://~/.open-context/database/surrealdb/data');
await db.use('open_context', 'code_graph');
```

### CRUD 操作

```typescript
// 插入
await db.insert('symbols', { symbol_id: '...', symbol_name: 'foo', ... });

// 查询
const symbols = await db.query(`
  SELECT * FROM symbols
  WHERE workspace_id = $ws AND symbol_kind = $kind
`, { ws: 'ws-123', kind: 'function' });

// 更新
await db.merge('symbols:id', { importance: 0.9 });

// 删除
await db.query('DELETE FROM symbols WHERE repo_id = $repo', { repo: 'repo-456' });
```

### 全文搜索

```typescript
const results = await db.query(
  `
  SELECT *, score::relevance(symbol_name) AS relevance
  FROM symbols
  WHERE symbol_name SEARCH $query
  ORDER BY relevance DESC
  LIMIT 20
`,
  { query: 'authentication' }
);
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
