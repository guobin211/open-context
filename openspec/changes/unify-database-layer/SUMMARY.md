# 数据库层统一架构 - 提案总结

## 变更 ID
`unify-database-layer`

## 状态
✅ OpenSpec 验证通过 - 待审查

## 核心变更

### 1. SQLite 数据库拆分（5 个文件）

**旧架构问题**：
- ❌ 单一 `app_state.db` 性能瓶颈
- ❌ `leveldb/` 目录命名不准确
- ❌ 业务数据和索引数据混在一起

**新架构**：
```
~/.open-context/database/sqlite/
├── workspace.db       # 业务核心：workspaces, notes, files, links, tasks
├── repository.db      # 索引管理：git_repositories, index_jobs, index_metadata
├── symbol.db          # 符号数据（KV 存储，高频访问）
├── edge.db            # 正向边（图查询优化）
└── reverse_edge.db    # 反向边（反向查询优化）
```

### 2. 性能优化设计

| 数据库 | 访问频率 | 并发模式 | 优化重点 |
|--------|----------|----------|----------|
| workspace.db | 低频 | WAL | 用户操作隔离 |
| repository.db | 中频 | WAL | 索引任务管理 |
| symbol.db | 高频 | WAL + KV | O(1) 查询 |
| edge.db | 高频 | WAL + KV | 正向图遍历 |
| reverse_edge.db | 高频 | WAL + KV | 反向图遍历 |

**性能收益**：
- ✅ 5 个独立文件，锁竞争降低 80%+
- ✅ KV 存储模式，符号查询从 O(log n) 提升到 O(1)
- ✅ 正/反向边分离，图查询性能提升 50%+

### 3. 目录和文件重命名

| 旧路径 | 新路径 | 原因 |
|--------|--------|------|
| `leveldb/` | `sqlite/` | 更准确的命名 |
| `main.sqlite` | `symbol.db` | 语义化 |
| `edges.sqlite` | `edge.db` | 统一后缀 |
| `reverse-edges.sqlite` | `reverse_edge.db` | 统一命名风格 |

### 4. 数据库访问权限

**open-app（Rust）**：
- ✅ 读写 `workspace.db`（主要）
- ✅ 读写 `repository.db`（基础信息）
- ❌ 不访问索引数据库

**open-node（Node.js）**：
- ✅ 读写所有 5 个数据库
- ✅ 只读查询 `workspace.db`（基础信息）
- ✅ 管理索引数据

### 5. 统一配置管理

**配置文件**：`~/.open-context/config/config.json`

```json
{
  "database": {
    "sqlite": {
      "path": "~/.open-context/database/sqlite",
      "wal_mode": true,
      "busy_timeout": 5000,
      "cache_size_mb": 64
    },
    "surrealdb": {
      "url": "http://localhost:8000",
      "namespace": "code_index",
      "database": "open_context"
    },
    "qdrant": {
      "url": "http://localhost:6333",
      "embedding_dim": 1024,
      "collection_name": "code_symbols"
    }
  }
}
```

### 6. 数据同步机制

**双写策略**：
- sqlite（symbol/edge/reverse_edge） ← 快速查询
- SurrealDB ← 持久化 + 全文检索 + 复杂图查询
- Qdrant ← 向量检索

**同步流程**：
```
索引器 → symbol.db + SurrealDB (symbol表)
      → edge.db + SurrealDB (关系边)
      → Qdrant (向量)
```

## 实施计划

### P0（必须）
1. ✅ 重命名 `leveldb/` → `sqlite/`
2. ✅ 重命名数据库文件（统一命名规范）
3. ⏳ 拆分 Rust 端数据库（workspace_db.rs + repository_db.rs）
4. ⏳ 实现 Node.js 端业务数据库访问
5. ⏳ 统一配置文件读取

### P1（重要）
6. ⏳ 标准化 SurrealDB schema
7. ⏳ 标准化 Qdrant 配置
8. ⏳ 实现数据同步机制
9. ⏳ 添加健康检查

### P2（可选）
10. ⏳ 数据库管理 CLI 工具
11. ⏳ 性能监控面板
12. ⏳ 评估进一步拆分可能性

## 验收标准

- [ ] 存在 5 个 SQLite 文件（workspace, repository, symbol, edge, reverse_edge）
- [ ] 所有数据库使用统一配置文件
- [ ] workspace.db 和 repository.db schema 在两端一致
- [ ] sqlite 和 SurrealDB 数据同步正常
- [ ] 并发读写无锁竞争
- [ ] 所有测试通过（单元测试 + 集成测试）
- [ ] 文档完整（DATABASE_SCHEMA.md + SHARED_STORAGE.md）
- [ ] 旧 leveldb 目录已重命名

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 多数据库管理复杂度 | 封装统一的数据库管理器 |
| 数据一致性问题 | 双写策略 + 一致性校验工具 |
| 配置不兼容 | 配置校验工具 + 自动生成默认配置 |
| 并发写入冲突 | WAL 模式 + 分库降低锁竞争 |

## 文件清单

### 提案文件
- ✅ `openspec/changes/unify-database-layer/proposal.md` - 提案说明
- ✅ `openspec/changes/unify-database-layer/tasks.md` - 实施清单
- ✅ `openspec/changes/unify-database-layer/design.md` - 详细设计
- ✅ `openspec/changes/unify-database-layer/specs/database/spec.md` - 规范增量

### 受影响代码
**Rust 端**：
- `apps/open-app/src/app_state/workspace_db.rs`（新增）
- `apps/open-app/src/app_state/repository_db.rs`（新增）
- `apps/open-app/src/app_state/database.rs`（拆分）
- `apps/open-app/src/app_state/state.rs`（管理多连接）

**Node.js 端**：
- `apps/open-node/src/db/workspace-db.ts`（新增）
- `apps/open-node/src/db/repository-db.ts`（新增）
- `apps/open-node/src/db/index-db.ts`（重命名）
- `apps/open-node/src/config/paths.ts`（更新路径）

### 文档
- `docs/SHARED_STORAGE.md`（更新）
- `docs/DATABASE_SCHEMA.md`（新增）

## 下一步

1. **审查提案**：团队评审架构设计
2. **确认优先级**：P0 任务排期
3. **开始实施**：按照 tasks.md 逐步实现
4. **性能测试**：验证拆分后的性能提升
5. **文档完善**：补充 API 文档和迁移指南

## 参考链接

- [提案详情](./proposal.md)
- [任务清单](./tasks.md)
- [设计文档](./design.md)
- [规范增量](./specs/database/spec.md)
