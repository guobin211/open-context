# 变更：重构 Indexer API 以支持细粒度索引

## 为什么

当前 open-node 的索引系统存在以下问题：

**索引粒度问题**：
1. **缺乏灵活性**：仅支持整个 workspace 级别的索引，无法独立索引单个文件或代码片段
2. **资源浪费**：修改单个文件时需要重新索引整个 workspace
3. **用户体验差**：实时编辑场景下无法快速更新索引
4. **可复用性低**：workspace 索引无法复用底层索引能力

**存储优化问题**：
1. **重复索引**：同一文件多次索引时未检测重复，导致数据冗余
2. **存储分散**：使用 LevelDB (Keyv+SQLite) + Qdrant，缺乏统一的索引管理
3. **查询单一**：仅支持向量检索，缺少全文检索和图查询的组合能力
4. **权重固定**：无法根据场景自定义向量、全文、图查询的权重

## 变更内容

**API 细粒度重构**：

- **新增 `indexFile(filePath: string, content: string)`**：针对单个文件建立索引
- **新增 `indexContent(content: string)`**：针对代码片段建立索引（无文件路径）
- **新增 `indexGitRepo(repoPath: string, repoId: string)`**：针对 Git 仓库建立索引
- **重构现有 workspace 索引**：复用上述 API 实现

**存储层优化**：

- **引入 SurrealDB**：使用 `@surrealdb/node` 统一管理符号元数据、全文索引和图关系
- **保留 Qdrant**：继续使用 `@qdrant/js-client-rest` 进行向量存储和语义搜索
- **简化 LevelDB**：`@keyv/sqlite` 仅用于缓存和会话状态，不再存储索引数据
- **去重机制**：通过文件路径 + 内容哈希检测重复索引，避免数据冗余

**混合查询增强**：

- **向量检索**：通过 Qdrant 进行语义相似度搜索
- **全文检索**：通过 SurrealDB 内置的全文索引进行关键词搜索
- **图查询**：通过 SurrealDB 图关系查询依赖链和调用关系
- **权重融合**：支持自定义三种查询方式的权重系数，结果按加权分数排序

## 影响

- 受影响规范：`indexer`, `storage`（新增规范）
- 受影响代码：
  - `apps/open-node/src/indexers/common-indexer.ts`（扩展 API、添加去重）
  - `apps/open-node/src/indexers/impl/code-indexer.ts`（复用）
  - `apps/open-node/src/indexers/impl/markdown-indexer.ts`（复用）
  - `apps/open-node/src/db/surrealdb-client.ts`（新增）
  - `apps/open-node/src/db/leveldb.ts`（简化用途）
  - `apps/open-node/src/services/vector-service.ts`（保持不变）
  - `apps/open-node/src/services/graph-service.ts`（迁移到 SurrealDB）
  - `apps/open-node/src/services/rag-service.ts`（添加混合查询）
  - `apps/open-node/src/services/fulltext-service.ts`（新增）
  - `apps/open-node/src/api/*`（新增 API 端点）
