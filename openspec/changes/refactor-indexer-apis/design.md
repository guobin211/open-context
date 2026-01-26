## 上下文

当前 open-node 的索引系统存在以下技术债务：

**索引粒度问题**：
1. **单一入口点**：`CommonIndexer.index()` 仅支持完整的 workspace 上下文参数
2. **紧耦合**：所有索引操作都依赖 `workspaceId`, `repoId`, `repoName`, `commit` 等完整元数据
3. **难以扩展**：新增场景（如实时编辑预览、在线代码片段索引）无法复用现有能力

**存储架构问题**：
1. **数据分散**：符号元数据存储在 LevelDB (Keyv+SQLite)，向量存储在 Qdrant，图关系存储在 LevelDB
2. **查询单一**：仅支持向量检索，缺少全文检索能力
3. **图查询低效**：LevelDB 不支持原生图遍历，需要多次读取操作
4. **重复索引**：缺乏去重检测机制，同一文件多次索引导致数据冗余

现有代码中 `MarkdownIndexer.indexFile()` 方法已经存在但未完整实现（返回空数组），说明团队已意识到此需求。

## 目标 / 非目标

### 目标

**API 层面**：
- 提供细粒度索引 API，支持独立索引文件、内容、仓库
- workspace 索引通过组合调用细粒度 API 实现，提高代码复用
- 新 API 可独立使用，不依赖完整 workspace 元数据
- 保持向后兼容，不破坏现有 workspace 索引流程

**存储层面**：
- 引入 SurrealDB 统一管理符号元数据、全文索引和图关系
- 保留 Qdrant 进行向量存储和语义搜索
- 简化 LevelDB 用途，仅用于缓存和会话状态
- 实现文件内容去重检测，避免重复索引

**查询层面**：
- 支持向量检索、全文检索、图查询的混合查询模式
- 允许自定义三种查询方式的权重系数
- 结果按加权分数排序，提供更精准的检索结果

### 非目标

- 不改变现有索引器的核心算法（AST 解析、符号提取、向量生成）
- 不重构前端调用层（仅扩展后端 API）
- 不支持增量索引（diff-based indexing），可在后续迭代中添加
- 不修改 Qdrant 的向量存储结构

## 决策

### 决策 1：API 设计采用渐进式参数模式

三个新 API 参数逐渐简化，体现不同抽象层级：

```typescript
// 最完整：Git 仓库索引（包含仓库元数据）
indexGitRepo(repoPath: string, repoId: string, workspaceId?: string): Promise<IndexResult>

// 中等：文件索引（包含文件路径）
indexFile(filePath: string, content: string, metadata?: Partial<IndexParams>): Promise<IndexResult>

// 最简：内容索引（纯内容，无路径）
indexContent(content: string, language: SupportLanguage, metadata?: Partial<IndexParams>): Promise<IndexResult>
```

**理由**：
- 满足不同场景需求（从完整仓库到临时代码片段）
- 可选 metadata 参数支持扩展，但不强制要求
- 统一返回 `IndexResult` 类型，便于下游处理

**考虑的替代方案**：
- **方案 A**：单一 `index()` 方法 + 多种参数组合 → 拒绝，参数验证逻辑复杂
- **方案 B**：完全独立的 FileIndexer/ContentIndexer 类 → 拒绝，增加维护成本

### 决策 2：引入 SurrealDB 作为主存储层

使用 SurrealDB (`@surrealdb/node`) 替代 LevelDB 存储符号元数据和图关系：

**Schema 设计**：

```typescript
// symbol 表
DEFINE TABLE symbol SCHEMAFULL;
DEFINE FIELD workspace_id ON symbol TYPE string;
DEFINE FIELD repo_id ON symbol TYPE string;
DEFINE FIELD file_path ON symbol TYPE string;
DEFINE FIELD content_hash ON symbol TYPE string;
DEFINE FIELD symbol_id ON symbol TYPE string;
DEFINE FIELD symbol_name ON symbol TYPE string;
DEFINE FIELD symbol_kind ON symbol TYPE string;
DEFINE FIELD code ON symbol TYPE string;
DEFINE FIELD signature ON symbol TYPE option<string>;
DEFINE FIELD language ON symbol TYPE string;
DEFINE FIELD exported ON symbol TYPE bool;
DEFINE FIELD visibility ON symbol TYPE string;
DEFINE FIELD importance ON symbol TYPE float;
DEFINE FIELD commit ON symbol TYPE string;
DEFINE FIELD indexed_at ON symbol TYPE number;

// 全文索引
DEFINE INDEX symbol_name_idx ON symbol FIELDS symbol_name SEARCH ANALYZER simple BM25;
DEFINE INDEX code_idx ON symbol FIELDS code SEARCH ANALYZER simple BM25;
DEFINE INDEX signature_idx ON symbol FIELDS signature SEARCH ANALYZER simple BM25;

// 唯一索引（防止重复）
DEFINE INDEX symbol_unique_idx ON symbol FIELDS file_path, content_hash UNIQUE;

// 关系边
DEFINE TABLE depends_on SCHEMAFULL;
DEFINE FIELD in ON depends_on TYPE record<symbol>;
DEFINE FIELD out ON depends_on TYPE record<symbol>;

DEFINE TABLE calls SCHEMAFULL;
DEFINE FIELD in ON calls TYPE record<symbol>;
DEFINE FIELD out ON calls TYPE record<symbol>;

DEFINE TABLE extends SCHEMAFULL;
DEFINE FIELD in ON extends TYPE record<symbol>;
DEFINE FIELD out ON extends TYPE record<symbol>;
```

**理由**：
- **全文检索**：SurrealDB 原生支持 BM25 全文搜索，无需额外工具
- **图查询**：原生支持图遍历，查询性能优于 LevelDB 的多次读取
- **Schema 约束**：`SCHEMAFULL` 和 `UNIQUE` 索引提供数据完整性保证
- **统一管理**：符号元数据和图关系在同一数据库，简化维护

**考虑的替代方案**：
- **方案 A**：继续使用 LevelDB + 外部全文索引库（如 Elasticlunr）→ 拒绝，增加复杂度
- **方案 B**：使用 Neo4j 图数据库 → 拒绝，资源占用大，部署复杂
- **方案 C**：使用 PostgreSQL + pg_trgm 扩展 → 拒绝，不如 SurrealDB 轻量

### 决策 3：内容去重检测机制

通过文件路径 + 内容哈希检测重复索引：

```typescript
import { xxhash64 } from '@node-rs/xxhash';

function generateContentHash(content: string): string {
  return xxhash64(Buffer.from(content)).toString(16);
}

async function checkDuplicate(filePath: string, content: string): Promise<boolean> {
  const contentHash = generateContentHash(content);
  const existing = await surrealdb.query(
    'SELECT * FROM symbol WHERE file_path = $path AND content_hash = $hash',
    { path: filePath, hash: contentHash }
  );
  return existing.length > 0;
}
```

**理由**：
- 使用 `xxhash64`（已安装 `@node-rs/xxhash`）生成快速哈希
- 文件路径 + 内容哈希组合唯一标识文件内容
- SurrealDB `UNIQUE` 索引自动拒绝重复插入

**权衡**：文件重命名会被视为新文件 → 可接受，因为用户明确创建了新引用

### 决策 4：默认生成虚拟元数据

当缺少完整元数据时，使用合理的默认值：

```typescript
const defaultMetadata = {
  workspaceId: metadata?.workspaceId || 'virtual',
  repoId: metadata?.repoId || generateShortId(),
  repoName: metadata?.repoName || 'untitled',
  commit: metadata?.commit || 'HEAD',
};
```

**理由**：
- 下游存储层（SurrealDB, Qdrant）依赖这些字段作为 ID 生成依据
- 虚拟 ID 允许临时索引（如编辑器预览）不污染正式数据
- 保持 `IndexResult` 数据结构一致性

**风险**：虚拟 ID 可能与真实 ID 冲突 → **缓解**：使用 `virtual-` 前缀区分

### 决策 5：混合查询权重融合算法

支持向量、全文、图查询的加权融合：

```typescript
interface HybridSearchOptions {
  query: string;
  workspaceId: string;
  weights?: {
    vector?: number;    // 默认 0.6
    fulltext?: number;  // 默认 0.3
    graph?: number;     // 默认 0.1
  };
  topK?: number;
}

async function hybridSearch(options: HybridSearchOptions): Promise<SearchResult[]> {
  const weights = {
    vector: options.weights?.vector ?? 0.6,
    fulltext: options.weights?.fulltext ?? 0.3,
    graph: options.weights?.graph ?? 0.1
  };

  // 归一化权重
  const total = weights.vector + weights.fulltext + weights.graph;
  const normalizedWeights = {
    vector: weights.vector / total,
    fulltext: weights.fulltext / total,
    graph: weights.graph / total
  };

  // 并行执行三种查询
  const [vectorResults, fulltextResults, graphResults] = await Promise.all([
    vectorService.search({ query: options.query, workspaceId: options.workspaceId }),
    fulltextService.search({ query: options.query, workspaceId: options.workspaceId }),
    graphService.searchRelated({ query: options.query, workspaceId: options.workspaceId })
  ]);

  // 合并结果，按加权分数排序
  const merged = mergeResults(vectorResults, fulltextResults, graphResults, normalizedWeights);
  return merged.slice(0, options.topK || 10);
}

function mergeResults(
  vectorResults: VectorResult[],
  fulltextResults: FulltextResult[],
  graphResults: GraphResult[],
  weights: { vector: number; fulltext: number; graph: number }
): SearchResult[] {
  const scoreMap = new Map<string, number>();

  // 计算向量得分（0-1 归一化）
  for (const result of vectorResults) {
    const score = result.score * weights.vector;
    scoreMap.set(result.symbolId, (scoreMap.get(result.symbolId) || 0) + score);
  }

  // 计算全文得分（BM25 归一化到 0-1）
  const maxBM25 = Math.max(...fulltextResults.map(r => r.bm25Score), 1);
  for (const result of fulltextResults) {
    const score = (result.bm25Score / maxBM25) * weights.fulltext;
    scoreMap.set(result.symbolId, (scoreMap.get(result.symbolId) || 0) + score);
  }

  // 计算图得分（根据路径长度归一化）
  for (const result of graphResults) {
    const score = (1 / (result.pathLength + 1)) * weights.graph;
    scoreMap.set(result.symbolId, (scoreMap.get(result.symbolId) || 0) + score);
  }

  // 按加权总分排序
  return Array.from(scoreMap.entries())
    .map(([symbolId, score]) => ({ symbolId, score }))
    .sort((a, b) => b.score - a.score);
}
```

**理由**：
- **默认权重**：向量检索优先（60%），全文辅助（30%），图增强（10%）
- **归一化**：确保权重总和为 1，便于比较
- **并行查询**：三种查询同时执行，减少延迟
- **可定制**：用户可根据场景调整权重（如代码导航场景图权重提高）

**考虑的替代方案**：
- **方案 A**：使用学习排序（Learning to Rank）模型 → 拒绝，增加复杂度且需要训练数据
- **方案 B**：固定权重，不允许自定义 → 拒绝，缺乏灵活性

### 决策 6：复用现有 CodeIndexer 和 MarkdownIndexer

不创建新的索引器实现，直接扩展 `CommonIndexer` 作为门面：

```typescript
export class CommonIndexer {
  private codeIndexer = new CodeIndexer();
  private markdownIndexer = new MarkdownIndexer();

  async indexFile(filePath: string, content: string, metadata?: Partial<IndexParams>) {
    const language = this.detectLanguage(filePath);
    const params = this.buildIndexParams(filePath, content, language, metadata);

    if (language === 'markdown') {
      return this.markdownIndexer.index(params);
    }
    return this.codeIndexer.index(params);
  }
}
```

**理由**：
- 避免重复实现 AST 解析和符号提取逻辑
- 统一入口点，便于依赖注入和测试
- 语言检测逻辑可复用（通过文件扩展名映射）

## 风险 / 权衡

### 风险 1：SurrealDB 迁移成本

从 LevelDB 迁移到 SurrealDB 需要数据迁移和测试。

**缓解措施**：
- 编写迁移脚本，自动从 LevelDB 读取并写入 SurrealDB
- 迁移前备份 LevelDB 数据
- 提供回滚脚本，如果出现问题可快速恢复

### 风险 2：全文检索性能

SurrealDB BM25 全文索引在大规模数据下的性能未知。

**缓解措施**：
- 在测试环境进行压力测试（10万+ 符号）
- 如果性能不足，考虑外部全文索引（如 MeiliSearch）
- 添加查询结果缓存机制
### 风险 3：虚拟 ID 管理

临时索引的虚拟 ID 可能堆积在数据库中。

**缓解措施**：
- 使用 TTL 机制，自动清理 `workspaceId === 'virtual'` 的数据
- 添加 `DELETE /api/v1/index/virtual` 端点手动清理

### 风险 4：语言检测失败

`indexContent()` 方法需要显式传入 `language` 参数，可能传错。

**缓解措施**：
- 如果无法解析，返回友好错误信息而非崩溃
- 提供 `detectLanguageFromContent()` 工具函数（基于启发式规则）

### 权衡：不支持增量索引

当前设计每次调用都是全量索引，不支持 diff-based 索引。

**理由**：增量索引需要复杂的状态管理和 diff 算法，超出当前范围。可在后续迭代中添加。

## 迁移计划

### 第一阶段：引入 SurrealDB 和新 API（不影响现有代码）

1. 创建 `surrealdb-client.ts` 和 Schema 定义
2. 实现 `indexFile`, `indexContent`, `indexGitRepo` 方法
3. 添加对应的 REST API 端点
4. 编写测试验证独立运行

### 第二阶段：数据迁移

1. 编写迁移脚本，从 LevelDB 迁移到 SurrealDB
2. 在测试环境验证数据完整性
3. 在生产环境执行迁移（带备份）

### 第三阶段：重构服务层

1. 修改 `GraphService` 使用 SurrealDB
2. 修改 workspace 索引服务，复用 `indexGitRepo`
3. 实现混合查询 API
4. 监控性能和错误率

### 回滚策略

- SurrealDB 迁移失败：使用备份恢复 LevelDB 数据
- 新 API 出现问题：移除 API 端点，恢复原始实现
- 混合查询性能差：回退到纯向量检索

## 待决问题

1. **虚拟索引的 TTL 时长**：1 小时？24 小时？由配置决定？
2. **是否支持批量索引**：`indexFiles(files: Array<{path, content}>)` → 待评估性能收益
3. **语言检测策略**：基于扩展名 vs 基于内容启发式 → 建议先扩展名，后续优化
4. **SurrealDB 部署方式**：嵌入式（RocksDB）vs 独立进程 → 建议先嵌入式，便于部署
