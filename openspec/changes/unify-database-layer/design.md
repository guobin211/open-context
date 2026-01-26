# 设计文档

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Open-Context 应用                       │
├─────────────────────┬───────────────────────────────────────┤
│    Tauri 端          │         Node.js 端                    │
│   (open-app)        │        (open-node)                    │
│                     │                                        │
│  ┌──────────────┐  │  ┌──────────────┐                     │
│  │ DatabaseMgr  │  │  │ DatabaseMgr  │                     │
│  └──────┬───────┘  │  └──────┬───────┘                     │
│         │          │         │                              │
└─────────┼──────────┴─────────┼──────────────────────────────┘
          │                    │
          │  共享配置文件       │
          ├────────────────────┤
          │  config.json       │
          └────────────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
│  SQLite   │ │SurrealDB│ │  Qdrant   │
│业务/关系  │ │图/全文  │ │  向量     │
└───────────┘ └─────────┘ └───────────┘
```

### 数据流设计

#### 1. 索引流程

```
用户触发索引
    │
    ▼
┌─────────────┐
│  open-web   │ (前端)
└──────┬──────┘
       │ Tauri IPC / HTTP
       ▼
┌─────────────┐     启动/复用      ┌─────────────┐
│  open-app   │ ─────────────────▶ │  open-node  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ 写入元数据                        │ 索引处理
       ▼                                  ▼
  ┌─────────┐                    ┌──────────────┐
  │ SQLite  │                    │ Indexer      │
  │ (metadata)                   │ - 解析代码   │
  └─────────┘                    │ - 提取符号   │
                                 │ - 构建图谱   │
                                 └──────┬───────┘
                                        │
                        ┌───────────────┼───────────────┐
                        ▼               ▼               ▼
                   ┌─────────┐   ┌──────────┐   ┌──────────┐
                   │ SQLite  │   │SurrealDB │   │ Qdrant   │
                   │ (cache) │   │(符号+图) │   │ (向量)   │
                   └─────────┘   └──────────┘   └──────────┘
```

#### 2. 查询流程

```
用户查询
    │
    ▼
┌─────────────┐
│  open-web   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────┐
│  open-node  │
│  RAG Service│
└──────┬──────┘
       │
       ├───────────────────┬───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐   ┌──────────────┐
│ VectorSearch │    │FullTextSearch│   │ GraphQuery   │
│  (Qdrant)    │    │ (SurrealDB)  │   │ (SurrealDB)  │
└──────┬───────┘    └──────┬───────┘   └──────┬───────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  混合结果融合    │
                  │ - 权重排序      │
                  │ - 去重         │
                  │ - Top-K        │
                  └─────────────────┘
```

## 数据库设计

### SQLite Schema

#### 核心表

```sql
-- 工作空间（open-app 现有）
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Git 仓库（扩展：合并 open-app 和 open-node 需求）
CREATE TABLE git_repositories (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    remote_url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    branch TEXT NOT NULL,
    default_branch TEXT,
    last_commit_hash TEXT,
    last_synced_at INTEGER,
    -- 克隆状态
    clone_status TEXT NOT NULL DEFAULT 'pending', -- pending, cloning, completed, failed
    clone_progress INTEGER NOT NULL DEFAULT 0,
    -- 索引状态
    index_status TEXT NOT NULL DEFAULT 'not_indexed', -- not_indexed, indexing, indexed, failed
    indexed_at INTEGER,
    -- 统计信息
    file_count INTEGER NOT NULL DEFAULT 0,
    symbol_count INTEGER NOT NULL DEFAULT 0, -- 新增
    vector_count INTEGER NOT NULL DEFAULT 0, -- 新增
    -- 通用字段
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 索引任务（新增）
CREATE TABLE index_jobs (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL,
    job_type TEXT NOT NULL, -- full, incremental, file, content
    status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    progress INTEGER NOT NULL DEFAULT 0, -- 0-100
    total_files INTEGER,
    processed_files INTEGER NOT NULL DEFAULT 0,
    total_symbols INTEGER,
    processed_symbols INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata TEXT, -- JSON: {files: [], options: {}}
    started_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (repo_id) REFERENCES git_repositories(id) ON DELETE CASCADE
);

-- 索引元数据缓存（新增，用于快速查询）
CREATE TABLE index_metadata (
    id TEXT PRIMARY KEY,
    repo_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_hash TEXT NOT NULL, -- 用于检测文件变更
    last_indexed_at INTEGER NOT NULL,
    symbol_count INTEGER NOT NULL DEFAULT 0,
    language TEXT,
    file_size INTEGER,
    UNIQUE(repo_id, file_path),
    FOREIGN KEY (repo_id) REFERENCES git_repositories(id) ON DELETE CASCADE
);
```

#### 索引

```sql
-- 仓库相关索引
CREATE INDEX idx_repos_workspace ON git_repositories(workspace_id);
CREATE INDEX idx_repos_clone_status ON git_repositories(clone_status);
CREATE INDEX idx_repos_index_status ON git_repositories(index_status);
CREATE INDEX idx_repos_archived ON git_repositories(workspace_id, is_archived);

-- 任务相关索引
CREATE INDEX idx_jobs_repo ON index_jobs(repo_id);
CREATE INDEX idx_jobs_status ON index_jobs(status);
CREATE INDEX idx_jobs_created ON index_jobs(created_at DESC);

-- 元数据相关索引
CREATE INDEX idx_metadata_repo ON index_metadata(repo_id);
CREATE INDEX idx_metadata_hash ON index_metadata(content_hash);
CREATE INDEX idx_metadata_indexed ON index_metadata(last_indexed_at DESC);
```

### SurrealDB Schema

```surql
-- ========================================
-- Namespace 和 Database
-- ========================================
USE NS code_index;
USE DB open_context;

-- ========================================
-- 符号表（核心）
-- ========================================
DEFINE TABLE symbol SCHEMAFULL;

-- 基础字段
DEFINE FIELD workspace_id ON symbol TYPE string;
DEFINE FIELD repo_id ON symbol TYPE string;
DEFINE FIELD repo_name ON symbol TYPE string;
DEFINE FIELD file_path ON symbol TYPE string;
DEFINE FIELD content_hash ON symbol TYPE string;

-- 符号信息
DEFINE FIELD symbol_id ON symbol TYPE string;
DEFINE FIELD symbol_name ON symbol TYPE string;
DEFINE FIELD symbol_kind ON symbol TYPE string; -- function, class, method, etc.
DEFINE FIELD code ON symbol TYPE string;
DEFINE FIELD signature ON symbol TYPE option<string>;

-- 元数据
DEFINE FIELD language ON symbol TYPE string;
DEFINE FIELD exported ON symbol TYPE bool;
DEFINE FIELD visibility ON symbol TYPE string; -- public, private, protected
DEFINE FIELD importance ON symbol TYPE float; -- 0.0-1.0
DEFINE FIELD commit ON symbol TYPE string;
DEFINE FIELD indexed_at ON symbol TYPE number;

-- ========================================
-- 全文索引（BM25）
-- ========================================
DEFINE ANALYZER ascii_analyzer TOKENIZERS blank,class FILTERS lowercase,ascii;

-- 符号名称索引
DEFINE INDEX symbol_name_idx ON symbol
    FIELDS symbol_name
    SEARCH ANALYZER ascii_analyzer BM25;

-- 代码内容索引
DEFINE INDEX code_idx ON symbol
    FIELDS code
    SEARCH ANALYZER ascii_analyzer BM25;

-- 函数签名索引
DEFINE INDEX signature_idx ON symbol
    FIELDS signature
    SEARCH ANALYZER ascii_analyzer BM25;

-- ========================================
-- 唯一索引（去重）
-- ========================================
DEFINE INDEX symbol_unique_idx ON symbol
    FIELDS file_path, content_hash
    UNIQUE;

-- ========================================
-- 查询索引（过滤）
-- ========================================
DEFINE INDEX workspace_id_idx ON symbol FIELDS workspace_id;
DEFINE INDEX repo_id_idx ON symbol FIELDS repo_id;
DEFINE INDEX symbol_kind_idx ON symbol FIELDS symbol_kind;
DEFINE INDEX language_idx ON symbol FIELDS language;

-- ========================================
-- 关系边表（图查询）
-- ========================================
-- 导入关系
DEFINE TABLE IMPORTS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;

-- 调用关系
DEFINE TABLE CALLS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;

-- 实现关系
DEFINE TABLE IMPLEMENTS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;

-- 继承关系
DEFINE TABLE EXTENDS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;

-- 使用关系
DEFINE TABLE USES SCHEMAFULL TYPE RELATION IN symbol OUT symbol;

-- 引用关系（通用）
DEFINE TABLE REFERENCES SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
```

### Qdrant Schema

```typescript
{
  collection_name: "code_symbols",
  vectors: {
    size: 1024, // 从配置文件读取
    distance: "Cosine"
  },
  payload_schema: {
    workspace_id: "keyword",    // 用于过滤
    repo_id: "keyword",         // 用于过滤
    symbol_kind: "keyword",     // 用于过滤
    exported: "bool",           // 用于过滤
    language: "keyword",        // 用于过滤
    importance: "float",        // 用于排序
    indexed_at: "integer"       // 用于排序
  }
}
```

## 并发控制设计

### SQLite WAL 模式

```rust
// Rust 端配置
let conn = Connection::open(db_path)?;
conn.execute_batch(
    "PRAGMA journal_mode = WAL;
     PRAGMA synchronous = NORMAL;
     PRAGMA busy_timeout = 5000;
     PRAGMA temp_store = MEMORY;
     PRAGMA mmap_size = 30000000000;"
)?;
```

```typescript
// Node.js 端配置
import Database from 'better-sqlite3';

const db = new Database(dbPath, {
  readonly: false,
  fileMustExist: false,
  timeout: 5000
});

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = -64000'); // 64MB
```

### 访问模式矩阵

| 操作类型         | open-app    | open-node   | 冲突可能性 | 解决方案       |
| ---------------- | ----------- | ----------- | ---------- | -------------- |
| 读取 workspace   | 高频        | 低频        | 无         | -              |
| 写入 workspace   | 高频        | 无          | 无         | -              |
| 读取 repo        | 中频        | 高频        | 无         | -              |
| 写入 repo        | 低频        | 高频        | 低         | WAL 模式       |
| 读取 index_jobs  | 中频        | 高频        | 无         | -              |
| 写入 index_jobs  | 无          | 高频        | 无         | -              |
| 读取 metadata    | 低频        | 高频        | 无         | -              |
| 写入 metadata    | 无          | 高频        | 无         | -              |

## 配置管理设计

### 配置文件结构

```json
{
  "version": "0.1.0",
  "database": {
    "sqlite": {
      "data_path": "~/.open-context/database/sqlite",
      "wal_mode": true,
      "busy_timeout": 5000,
      "cache_size_mb": 64,
      "mmap_size_gb": 30
    },
    "surrealdb": {
      "url": "http://localhost:8000",
      "namespace": "code_index",
      "database": "open_context",
      "username": "root",
      "password": "root",
      "embedded": false,
      "data_path": "~/.open-context/database/surrealdb"
    },
    "qdrant": {
      "url": "http://localhost:6333",
      "api_key": null,
      "embedding_dim": 1024,
      "collection_name": "code_symbols",
      "distance_metric": "Cosine",
      "embedded": false,
      "data_path": "~/.open-context/database/qdrant"
    }
  },
  "node_server": {
    "port": 4500,
    "auto_start": true,
    "health_check_interval_ms": 30000
  },
  "indexer": {
    "batch_size": 100,
    "max_file_size_mb": 10,
    "skip_patterns": ["node_modules", ".git", "dist", "build"]
  },
  "log_level": "info"
}
```

### 配置读取优先级

1. 环境变量（最高优先级）
2. 配置文件 `~/.open-context/config/config.json`
3. 默认值（最低优先级）

```typescript
// 示例：Qdrant URL 解析
const qdrantUrl =
  process.env.QDRANT_URL ||                    // 环境变量
  config.database.qdrant.url ||                // 配置文件
  'http://localhost:6333';                     // 默认值
```

## 错误处理设计

### 错误类型

```typescript
enum DatabaseErrorCode {
  CONNECTION_FAILED = 'DB_CONNECTION_FAILED',
  MIGRATION_FAILED = 'DB_MIGRATION_FAILED',
  SCHEMA_MISMATCH = 'DB_SCHEMA_MISMATCH',
  CONCURRENT_WRITE = 'DB_CONCURRENT_WRITE',
  DISK_FULL = 'DB_DISK_FULL',
  CORRUPT_DATA = 'DB_CORRUPT_DATA',
}

class DatabaseError extends Error {
  constructor(
    public code: DatabaseErrorCode,
    public message: string,
    public cause?: Error
  ) {
    super(message);
  }
}
```

### 错误恢复策略

| 错误类型          | 策略                         |
| ----------------- | ---------------------------- |
| 连接失败          | 重试 3 次，指数退避          |
| Schema 初始化失败 | 报告错误，停止启动           |
| 并发写入冲突      | 自动重试（WAL 模式下很少见） |
| 磁盘已满          | 清理缓存，报告错误           |
| 数据损坏          | 报告错误，提示用户恢复备份   |

## 性能优化

### SQLite 优化

- **WAL 模式**：支持并发读写
- **内存缓存**：64MB cache_size
- **mmap**：30GB 内存映射
- **批量插入**：使用事务
- **预编译语句**：复用 prepared statements

### SurrealDB 优化

- **批量 upsert**：一次插入多个符号
- **索引优化**：仅为查询字段建索引
- **连接池**：复用连接
- **异步查询**：避免阻塞

### Qdrant 优化

- **批量 upsert**：批量插入向量
- **Payload 索引**：为过滤字段建索引
- **量化**：使用 scalar 或 product 量化减少内存
- **分片**：大规模数据分片存储

## 监控指标

### SQLite 监控

- 数据库文件大小
- WAL 文件大小
- 查询延迟（p50, p95, p99）
- 事务成功率
- 锁等待时间

### SurrealDB 监控

- 连接池使用率
- 查询延迟
- 全文检索命中率
- 图查询深度分布

### Qdrant 监控

- 向量数量
- 搜索延迟
- 索引内存使用
- API 请求成功率
