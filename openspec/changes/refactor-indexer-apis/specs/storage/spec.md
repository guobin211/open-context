## 新增需求

### 需求：索引去重检测

系统必须在索引文件时检测重复，避免同一文件内容被多次索引。

#### 场景：文件内容未改变时跳过索引

- **当** 调用 `indexFile('src/utils.ts', 'content')` 两次，且内容相同
- **那么** 第二次调用检测到重复，跳过索引，返回已存在的索引结果

#### 场景：文件内容改变时重新索引

- **当** 调用 `indexFile('src/utils.ts', 'content1')`，然后调用 `indexFile('src/utils.ts', 'content2')`
- **那么** 第二次调用检测到内容变化，删除旧索引，创建新索引

#### 场景：通过内容哈希检测重复

- **当** 系统计算文件内容哈希
- **那么** 使用 `xxhash64` 算法生成 16 进制哈希字符串

---

### 需求：SurrealDB 符号存储

系统必须使用 SurrealDB 存储符号元数据，替代 LevelDB。

#### 场景：创建 symbol 表

- **当** 系统初始化 SurrealDB 数据库
- **那么** 创建 `symbol` 表，包含字段：`workspace_id`, `repo_id`, `file_path`, `content_hash`, `symbol_id`, `symbol_name`, `symbol_kind`, `code`, `signature`, `language`, `exported`, `visibility`, `importance`, `commit`, `indexed_at`

#### 场景：配置唯一索引

- **当** 创建 `symbol` 表
- **那么** 在 `file_path` 和 `content_hash` 字段上创建唯一索引

#### 场景：插入符号数据

- **当** 调用 `surrealdb.upsertSymbol(symbolPayload)`
- **那么** 使用 `UPSERT` 语句插入或更新符号数据

#### 场景：查询符号数据

- **当** 调用 `surrealdb.getSymbol(symbolId)`
- **那么** 返回对应的符号元数据对象

---

### 需求：SurrealDB 图关系存储

系统必须使用 SurrealDB 存储代码依赖关系图，替代 LevelDB 边存储。

#### 场景：创建关系边表

- **当** 系统初始化 SurrealDB 数据库
- **那么** 创建 `depends_on`, `calls`, `extends` 三个关系表

#### 场景：创建依赖关系

- **当** 调用 `surrealdb.createEdge(fromSymbolId, toSymbolId, 'depends_on')`
- **那么** 在 `depends_on` 表中插入一条从 `fromSymbolId` 到 `toSymbolId` 的边

#### 场景：查询依赖关系

- **当** 调用 `surrealdb.queryGraph(symbolId, depth: 2, edgeType: 'depends_on')`
- **那么** 返回从 `symbolId` 出发，深度为 2 的所有依赖节点和边

#### 场景：查询反向依赖

- **当** 调用 `surrealdb.queryReverseGraph(symbolId, edgeType: 'calls')`
- **那么** 返回所有调用 `symbolId` 的符号列表

---

### 需求：全文检索

系统必须支持基于 SurrealDB BM25 的全文检索。

#### 场景：配置全文索引

- **当** 创建 `symbol` 表
- **那么** 在 `symbol_name`, `code`, `signature` 字段上创建全文索引

#### 场景：关键词搜索

- **当** 调用 `fulltextService.search({ query: 'fetchUser', workspaceId: 'ws-123' })`
- **那么** 返回包含 'fetchUser' 关键词的符号列表，按 BM25 分数排序

#### 场景：支持过滤条件

- **当** 调用 `fulltextService.search({ query: 'user', filters: { language: 'typescript' } })`
- **那么** 仅返回 `language === 'typescript'` 的符号结果

---

### 需求：混合查询

系统必须支持向量检索、全文检索、图查询的混合查询模式。

#### 场景：使用默认权重查询

- **当** 调用 `ragService.hybridSearch({ query: 'authentication logic', workspaceId: 'ws-123' })`
- **那么** 使用默认权重 `{ vector: 0.6, fulltext: 0.3, graph: 0.1 }` 融合结果

#### 场景：自定义权重查询

- **当** 调用 `ragService.hybridSearch({ query: 'auth', weights: { vector: 0.4, fulltext: 0.4, graph: 0.2 } })`
- **那么** 使用自定义权重融合三种查询结果

#### 场景：权重归一化

- **当** 传入权重 `{ vector: 3, fulltext: 1, graph: 1 }`
- **那么** 自动归一化为 `{ vector: 0.6, fulltext: 0.2, graph: 0.2 }`

#### 场景：并行执行查询

- **当** 执行混合查询
- **那么** 向量检索、全文检索、图查询并行执行，减少总延迟

#### 场景：结果去重和排序

- **当** 三种查询返回相同的 `symbolId`
- **那么** 合并结果，累加加权分数，按总分降序排序

---

### 需求：API 端点 - 混合查询

系统必须提供 `POST /api/v1/query/hybrid` 端点，支持混合查询和权重配置。

#### 场景：成功执行混合查询

- **当** 发送 `POST /api/v1/query/hybrid` 请求，body 为 `{ "query": "user login", "workspaceId": "ws-123", "weights": {...} }`
- **那么** 返回 HTTP 200，body 包含混合查询结果和各查询方式的得分

#### 场景：缺少必需参数

- **当** 发送请求但缺少 `query` 或 `workspaceId`
- **那么** 返回 HTTP 400，错误信息为 `"Missing required fields: query, workspaceId"`

#### 场景：权重参数验证

- **当** 传入的权重值为负数或全为 0
- **那么** 返回 HTTP 400，错误信息为 `"Invalid weights: all values must be positive"`

---

### 需求：数据迁移工具

系统必须提供从 LevelDB 迁移到 SurrealDB 的工具。

#### 场景：迁移符号数据

- **当** 执行 `node scripts/migrate-to-surrealdb.js --type symbols`
- **那么** 读取 LevelDB 中所有符号数据，写入 SurrealDB `symbol` 表

#### 场景：迁移边数据

- **当** 执行 `node scripts/migrate-to-surrealdb.js --type edges`
- **那么** 读取 LevelDB 中所有边数据，写入 SurrealDB 对应关系表

#### 场景：迁移进度显示

- **当** 执行迁移脚本
- **那么** 实时显示迁移进度（已处理 / 总数量）

#### 场景：迁移失败回滚

- **当** 迁移过程中发生错误
- **那么** 回滚已迁移的数据，恢复 LevelDB 数据库状态

---

### 需求：LevelDB 用途简化

迁移完成后，LevelDB 必须仅用于缓存和会话状态，禁止存储索引数据。

#### 场景：移除符号存储逻辑

- **当** 系统需要存储符号
- **那么** 写入 SurrealDB 而非 LevelDB

#### 场景：移除边存储逻辑

- **当** 系统需要存储依赖关系
- **那么** 写入 SurrealDB 而非 LevelDB

#### 场景：保留缓存功能

- **当** 系统需要缓存临时数据（如 API 响应缓存）
- **那么** 继续使用 LevelDB 存储

---

## 修改需求

### 需求：GraphService 使用 SurrealDB

`GraphService` 必须从 SurrealDB 加载图数据，而非 LevelDB。

#### 场景：初始化时加载图数据

- **当** 调用 `graphService.init()`
- **那么** 从 SurrealDB 查询所有边数据，加载到内存图结构

#### 场景：查询依赖关系

- **当** 调用 `graphService.getDependencies(symbolId)`
- **那么** 优先从内存图查询，如果不存在则从 SurrealDB 实时查询

#### 场景：添加新边时同步到 SurrealDB

- **当** 调用 `graphService.addEdge(from, to, type)`
- **那么** 更新内存图，同时写入 SurrealDB

---

### 需求：RAGService 支持混合查询

`RAGService.query()` 方法必须支持混合查询模式和权重配置。

#### 场景：向后兼容纯向量查询

- **当** 调用 `ragService.query({ query: 'test', workspaceId: 'ws-123' })`（不传 weights）
- **那么** 使用默认权重进行混合查询

#### 场景：禁用某种查询方式

- **当** 调用 `ragService.query({ weights: { vector: 1, fulltext: 0, graph: 0 } })`
- **那么** 仅执行向量查询，跳过全文和图查询

---

## 移除需求

### 需求：LevelDB 符号存储

**原因**：迁移到 SurrealDB，LevelDB 不再用于符号存储

**迁移**：使用 `surrealdb.upsertSymbol()` 替代 `leveldb.put()`

---

### 需求：LevelDB 边存储

**原因**：迁移到 SurrealDB，LevelDB 不再用于图关系存储

**迁移**：使用 `surrealdb.createEdge()` 替代 `leveldb.putEdge()`
