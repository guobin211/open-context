# 变更：统一数据库层架构

## 为什么

当前 Open-Context 项目的数据库层存在以下问题：

**数据库分散问题**：
1. **双端独立管理**：open-app 和 open-node 各自管理数据库，导致数据结构不一致
2. **重复实现**：两端分别实现了 SQLite、Qdrant、SurrealDB 的连接管理
3. **数据孤岛**：前端（Tauri）和后端（Node.js）无法共享索引数据
4. **维护成本高**：修改数据结构需要同时更新两端代码

**存储路径不统一**：
1. **路径硬编码**：部分代码直接硬编码路径，未遵循 `~/.open-context/database/` 规范
2. **配置分散**：Qdrant URL、SurrealDB URL 等配置在两端分别配置
3. **初始化重复**：目录创建、权限检查在两端重复实现
4. **迁移困难**：无法轻松切换数据存储位置

**数据一致性问题**：
1. **Schema 不同步**：open-app 的 SQLite schema 与 open-node 可能不一致
2. **缺少事务支持**：跨数据库操作无法保证原子性
3. **并发冲突**：两端同时写入时可能产生数据竞争
4. **版本管理缺失**：缺少统一的数据库迁移机制

## 变更内容

**统一数据库架构**：

- **共享存储根目录**：`~/.open-context/database/` 作为唯一数据存储位置
- **四层数据库分工**：
  - **SQLite (workspace.db + repository.db)**：业务数据、关系数据、元数据
  - **SQLite (symbol.db + edge.db + reverse_edge.db)**：索引数据、符号、图边（KV 存储）
  - **SurrealDB**：图数据持久化、全文检索、复杂图查询
  - **Qdrant**：向量嵌入、语义检索
- **统一配置**：所有数据库连接配置统一从 `~/.open-context/config/config.json` 读取

**存储路径规范化**：

```
~/.open-context/database/
├── sqlite/                # SQLite 数据库目录（按业务拆分）
│   ├── workspace.db       # 工作空间、笔记、链接
│   ├── repository.db      # Git 仓库、索引任务
│   ├── symbol.db          # 符号数据（KV 存储）
│   ├── edge.db            # 正向边（依赖关系图）
│   └── reverse_edge.db    # 反向边（被依赖关系）
├── surrealdb/             # SurrealDB 数据目录
│   ├── open_context.db    # 数据文件
│   └── logs/              # 运行日志
└── qdrant/                # Qdrant 数据目录（可选，如果使用嵌入式）
    └── collections/       # 向量集合
```

**数据库文件用途说明**：

| 数据库文件               | 用途                           | 访问模式       | 特点               |
| ------------------------ | ------------------------------ | -------------- | ------------------ |
| `workspace.db`           | 工作空间、笔记、文件、链接     | 两端读写       | 业务核心数据       |
| `repository.db`          | Git 仓库、索引任务、元数据     | 两端读写       | 索引管理数据       |
| `symbol.db`              | 符号数据（symbol payload）     | open-node 读写 | KV 存储，高频访问  |
| `edge.db`                | 正向边（依赖关系图）           | open-node 读写 | 图查询优化         |
| `reverse_edge.db`        | 反向边（被依赖关系）           | open-node 读写 | 反向图查询优化     |

**SQLite 数据库架构**：

**按业务拆分为 5 个 SQLite 数据库**：

### 1. **`workspace.db`**（工作空间数据库）
- **用途**：工作空间、笔记、文件、链接等业务核心数据
- **访问**：open-app（主要） + open-node（只读查询）
- **表**：
  - `workspaces` - 工作空间管理
  - `notes` - 笔记数据
  - `imported_files` - 导入的文件
  - `imported_directories` - 导入的目录
  - `web_links` - Web 链接
  - `tasks` - 任务队列

### 2. **`repository.db`**（仓库数据库）
- **用途**：Git 仓库、索引任务、索引元数据
- **访问**：open-app（基础信息） + open-node（索引管理）
- **表**：
  - `git_repositories` - Git 仓库
  - `index_jobs` - 索引任务记录
  - `index_metadata` - 索引元数据

### 3. **`symbol.db`**（符号数据库）
- **用途**：符号数据（KV 存储）
- **访问**：仅 open-node
- **格式**：Keyv KV 存储
- **键格式**：`symbol:{symbolId}`
- **值格式**：JSON (SymbolPayload)

### 4. **`edge.db`**（正向边数据库）
- **用途**：正向依赖边
- **访问**：仅 open-node
- **格式**：Keyv KV 存储
- **键格式**：`{from}:{edgeType}`
- **值格式**：`string[]` (目标符号 ID 数组)

### 5. **`reverse_edge.db`**（反向边数据库）
- **用途**：反向依赖边（被依赖关系）
- **访问**：仅 open-node
- **格式**：Keyv KV 存储
- **键格式**：`{to}:{edgeType}`
- **值格式**：`string[]` (来源符号 ID 数组)

**为什么拆分数据库**：

1. **性能隔离**：
   - `workspace.db`：用户操作（笔记、链接），低频写入
   - `repository.db`：索引任务管理，中频写入
   - `symbol.db/edge.db/reverse_edge.db`：索引数据，高频读写
   - 互不干扰，避免锁竞争

2. **职责分离**：
   - 业务数据（workspace、repository）：关系型表
   - 索引数据（symbol、edge）：KV 存储
   - 各自优化，便于维护

3. **备份灵活**：
   - 业务数据定期备份
   - 索引数据可重建，无需备份

4. **并发优化**：
   - 5 个独立文件，WAL 模式下并发读写互不影响
   - 降低单文件锁等待时间

**SurrealDB 统一 Schema**：

```surql
-- 符号表（代码符号、文档块）
DEFINE TABLE symbol SCHEMAFULL;
DEFINE FIELD workspace_id ON symbol TYPE string;
DEFINE FIELD repo_id ON symbol TYPE string;
DEFINE FIELD file_path ON symbol TYPE string;
DEFINE FIELD content_hash ON symbol TYPE string;
DEFINE FIELD symbol_id ON symbol TYPE string;
DEFINE FIELD symbol_name ON symbol TYPE string;
DEFINE FIELD symbol_kind ON symbol TYPE string;
DEFINE FIELD code ON symbol TYPE string;
DEFINE FIELD language ON symbol TYPE string;

-- 全文索引
DEFINE INDEX symbol_name_idx ON symbol FIELDS symbol_name SEARCH ANALYZER ascii_analyzer BM25;
DEFINE INDEX code_idx ON symbol FIELDS code SEARCH ANALYZER ascii_analyzer BM25;

-- 去重索引
DEFINE INDEX symbol_unique_idx ON symbol FIELDS file_path, content_hash UNIQUE;

-- 关系边表
DEFINE TABLE IMPORTS TYPE RELATION IN symbol OUT symbol;
DEFINE TABLE CALLS TYPE RELATION IN symbol OUT symbol;
DEFINE TABLE IMPLEMENTS TYPE RELATION IN symbol OUT symbol;
DEFINE TABLE EXTENDS TYPE RELATION IN symbol OUT symbol;
DEFINE TABLE USES TYPE RELATION IN symbol OUT symbol;
DEFINE TABLE REFERENCES TYPE RELATION IN symbol OUT symbol;
```

**Qdrant 统一配置**：

- **Collection 名称**：`code_symbols`（统一命名）
- **向量维度**：从配置文件读取（默认 1024）
- **距离度量**：Cosine（统一使用余弦相似度）
- **Payload 索引**：`workspace_id`, `repo_id`, `symbol_kind`, `exported`, `language`

**配置文件扩展**：

`~/.open-context/config/config.json`：

```json
{
  "version": "0.1.0",
  "database": {
    "sqlite": {
      "path": "~/.open-context/database/app_state.db",
      "wal_mode": true,
      "busy_timeout": 5000
    },
    "surrealdb": {
      "url": "http://localhost:8000",
      "namespace": "code_index",
      "database": "open_context",
      "username": "root",
      "password": "root",
      "embedded": false
    },
    "qdrant": {
      "url": "http://localhost:6333",
      "api_key": null,
      "embedding_dim": 1024,
      "embedded": false
    }
  },
  "node_server": {
    "port": 4500,
    "auto_start": true
  },
  "log_level": "info"
}
```

**数据库初始化流程**：

1. **应用启动时**（open-app）：
   - 读取配置文件 `~/.open-context/config/config.json`
   - 创建必要目录结构 `~/.open-context/database/`
   - 初始化 SQLite 数据库（创建表、索引、迁移）
   - 检测 Qdrant/SurrealDB 可用性（可选）

2. **Node.js 服务启动时**（open-node）：
   - 读取配置文件（复用 Tauri 端配置）
   - 连接到 SQLite（只读或读写，根据场景决定）
   - 连接到 SurrealDB（初始化 schema）
   - 连接到 Qdrant（初始化 collection）
   - 启动健康检查（定期 ping 数据库连接）

**数据库访问模式**：

| 数据库                    | open-app 访问模式         | open-node 访问模式        | 并发控制       | 访问频率 |
| ------------------------- | ------------------------- | ------------------------- | -------------- | -------- |
| workspace.db              | 读写（主要）              | 只读（查询）              | WAL 模式       | 低频     |
| repository.db             | 读写（基础信息）          | 读写（索引管理）          | WAL 模式       | 中频     |
| symbol.db                 | 不访问                    | 读写（索引数据）          | WAL 模式       | 高频     |
| edge.db                   | 不访问                    | 读写（图数据）            | WAL 模式       | 高频     |
| reverse_edge.db           | 不访问                    | 读写（反向图）            | WAL 模式       | 高频     |
| SurrealDB                 | 只读（图查询、全文检索）  | 读写（持久化索引数据）    | 内置事务       | 中频     |
| Qdrant                    | 只读（向量检索）          | 读写（向量存储）          | 内置并发控制   | 中频     |

**开发阶段说明**：

项目当前处于开发阶段，不需要考虑数据迁移：
- ✅ 直接修改 schema，无需版本号管理
- ✅ 删除旧的 `leveldb/*.sqlite` 文件，重新索引
- ✅ 数据库初始化时直接创建最新 schema
- ⚠️ 生产环境部署后才需要添加迁移机制

## 影响

**受影响规范**：
- `storage`（重大更新）
- `indexer`（依赖统一的 schema）
- `database`（新增规范）

**受影响代码**：

**open-app（Rust）**：
- `apps/open-app/src/app_state/database.rs`（拆分为 workspace_db.rs 和 repository_db.rs）
- `apps/open-app/src/app_state/state.rs`（管理多个数据库连接）
- 新增 `apps/open-app/src/app_command/database_commands.rs`（数据库管理命令）

**open-node（Node.js）**：
- 新增 `apps/open-node/src/db/workspace-db.ts`（访问 workspace.db）
- 新增 `apps/open-node/src/db/repository-db.ts`（访问 repository.db）
- `apps/open-node/src/db/sqlite-db.ts`（重命名为 index-db.ts，访问 symbol/edge/reverse_edge）
- `apps/open-node/src/db/surrealdb-client.ts`（标准化 schema）
- `apps/open-node/src/db/qdrant-client.ts`（标准化配置、添加健康检查）
- `apps/open-node/src/db/index.ts`（导出统一的数据库管理器）
- `apps/open-node/src/config/index.ts`（读取统一配置文件）

**配置与文档**：
- `docs/SHARED_STORAGE.md`（更新数据库部分）
- 新增 `docs/DATABASE_SCHEMA.md`（详细 schema 文档）
- `.env.example`（更新数据库配置示例）

**测试**：
- `apps/open-node/tests/db/`（数据库测试）
- `apps/open-app/src/app_state/database_test.rs`（Rust 测试）

## 风险与缓解

**风险 1：多数据库复杂度**
- 缓解：封装统一的数据库管理器，隐藏底层细节
- 缓解：提供清晰的文档说明各数据库用途

**风险 2：并发写入冲突**
- 缓解：SQLite 使用 WAL 模式，支持并发读写
- 缓解：SurrealDB 和 Qdrant 内置并发控制

**风险 3：数据一致性**
- 缓解：leveldb 和 SurrealDB 数据双写，确保一致性
- 缓解：添加数据校验工具

**风险 4：配置不兼容**
- 缓解：提供配置校验工具 `openctx db validate-config`
- 缓解：自动生成默认配置文件

## 实施优先级

**P0（必须）**：
- [ ] 拆分 Rust 端数据库（workspace.db + repository.db）
- [ ] open-node 实现业务数据库访问（workspace-db.ts + repository-db.ts）
- [ ] 重命名 leveldb 目录为 sqlite 目录
- [ ] 重命名 leveldb/*.sqlite 为 sqlite/{symbol,edge,reverse_edge}.db
- [ ] 统一配置文件读取（两端都从 `config.json` 读取）

**P1（重要）**：
- [ ] 标准化 SurrealDB schema（持久化图数据）
- [ ] 标准化 Qdrant 配置（向量数据）
- [ ] 添加健康检查和错误处理
- [ ] 实现 sqlite 和 SurrealDB 的数据同步机制

**P2（可选）**：
- [ ] 数据库管理 CLI 工具（`openctx db` 命令）
- [ ] 性能监控和日志优化
- [ ] 评估是否需要进一步拆分业务数据库

## 参考

- [SHARED_STORAGE.md](../../docs/SHARED_STORAGE.md) - 现有存储规范
- [database.rs](../../apps/open-app/src/app_state/database.rs) - Rust SQLite 实现
- [sqlite-db.ts](../../apps/open-node/src/db/sqlite-db.ts) - Node.js SQLite 实现
- [surrealdb-client.ts](../../apps/open-node/src/db/surrealdb-client.ts) - SurrealDB 实现
- [qdrant-client.ts](../../apps/open-node/src/db/qdrant-client.ts) - Qdrant 实现
