# 任务清单

## 阶段 1：目录和文件重命名 ✅

- [x] 重命名数据库目录
  - [x] 将 `~/.open-context/database/leveldb/` 重命名为 `~/.open-context/database/sqlite/`

- [x] 重命名数据库文件
  - [x] `main.sqlite` → `symbol.db`
  - [x] `edges.sqlite` → `edge.db`
  - [x] `reverse-edges.sqlite` → `reverse_edge.db`

- [x] 更新配置路径
  - [x] 修改 `apps/open-node/src/config/paths.ts` 中的路径配置
  - [x] 将 `leveldb()` 改为 `sqlite()`

## 阶段 2：配置与路径统一 ⏳

- [ ] 扩展 `~/.open-context/config/config.json` 配置文件
  - [ ] 添加 `database.sqlite` 配置节
  - [ ] 添加 `database.surrealdb` 配置节
  - [ ] 添加 `database.qdrant` 配置节
  - [ ] 支持环境变量覆盖

- [ ] 实现配置读取模块（Rust）
  - [ ] 在 `apps/open-app/src/app_state/app_config.rs` 中添加数据库配置结构
  - [ ] 添加配置校验逻辑
  - [ ] 支持默认值和自动配置生成

- [x] 实现配置读取模块（Node.js）
  - [x] `apps/open-node/src/config/paths.ts` 中已实现路径配置
  - [x] 支持环境变量 `OPEN_CONTEXT_HOME` 覆盖
  - [ ] 在 `apps/open-node/src/config/database-config.ts` 中读取统一的数据库配置

- [x] 标准化存储路径
  - [x] 所有数据库连接使用 `~/.open-context/database/` 路径
  - [x] 已通过 `StoragePaths` 移除硬编码路径
  - [x] 已添加路径解析工具函数（`ensureStorageDir`）

## 阶段 3：SQLite Schema 拆分 ✅

- [x] 分析现有 schema
  - [x] 整理 open-app 现有表结构（`database.rs`）
  - [x] 规划数据库拆分方案（workspace.db vs repository.db）
  - [x] 识别表之间的依赖关系

- [x] 拆分 Rust 端数据库
  - [x] 拆分 `database.rs` 为 `workspace_db.rs` 和 `repository_db.rs`
  - [x] `workspace.db` 包含：workspaces、notes、imported_files、imported_directories、web_links、tasks
  - [x] `repository.db` 包含：git_repositories、index_jobs、index_metadata
  - [x] 在 `state.rs` 中管理多个数据库连接
  - [x] 更新相关索引

- [x] 实现 Node.js 端数据库访问
  - [x] 新增 `apps/open-node/src/db/workspace-db.ts`（使用 better-sqlite3 访问 workspace.db）
  - [x] 新增 `apps/open-node/src/db/repository-db.ts`（使用 better-sqlite3 访问 repository.db）
  - [x] 重命名 `sqlite-db.ts` 为 `index-db.ts`（访问 symbol/edge/reverse_edge）
  - [x] 实现基础 CRUD 操作（workspaces、repos、jobs、metadata）

- [ ] 数据同步机制
  - [ ] sqlite 索引数据和 SurrealDB 双写策略
  - [ ] 数据一致性校验

- [x] 标准化表定义（SurrealDB）
  - [x] 确保 `symbol` 表字段完整
  - [x] 添加必要的索引（全文、去重、workspace）
  - [x] 定义所有关系边表（IMPORTS, CALLS, IMPLEMENTS, EXTENDS, USES, REFERENCES）

- [x] 更新初始化脚本
  - [x] 在 `apps/open-node/src/db/surrealdb-client.ts` 中更新 `initSchema()`
  - [x] 确保 schema 定义完整
  - [x] 添加索引优化

- [ ] 添加 Rust 端只读访问（可选）
  - [ ] 在 `apps/open-app/Cargo.toml` 中添加 `surrealdb` 依赖
  - [ ] 实现基础查询封装
  - [ ] 添加健康检查

## 阶段 4：Qdrant 配置标准化 ✅

- [x] 统一 collection 配置
  - [x] 确保使用统一的 collection 名称 `code_symbols`
  - [x] 从配置文件读取向量维度（DefaultConfig.qdrant.embeddingDim）
  - [x] 标准化距离度量为 Cosine

- [x] 实现健康检查
  - [x] 已通过 `database-health-checker.ts` 实现连接测试
  - [ ] 添加自动重连机制
  - [ ] 添加连接池管理

- [x] 优化 payload 索引
  - [x] 确保所有必要字段都有索引（workspace_id, repo_id, symbol_kind, exported, language）
  - [x] 添加索引创建脚本（`createPayloadIndexes()`）
  - [ ] 验证索引性能

## 阶段 5：数据库管理器封装 ⏳

- [x] 实现统一数据库管理器（Node.js）
  - [x] 在 `apps/open-node/src/db/index.ts` 中导出统一接口
  - [x] 封装 SQLite、SurrealDB、Qdrant 连接
  - [x] 实现 `database-health-checker.ts` 健康检查
  - [ ] 实现统一的初始化流程
  - [ ] 添加关闭和清理逻辑

- [ ] 实现 Tauri 命令（Rust）
  - [ ] 添加 `database_status` 命令（查询数据库状态）
  - [ ] 添加 `validate_database` 命令（校验数据库一致性）

- [x] 添加错误处理
  - [x] 使用 pino 结构化日志记录错误
  - [ ] 统一错误类型定义
  - [ ] 实现优雅降级

## 阶段 6：测试与文档

- [ ] 编写单元测试
  - [ ] SQLite 连接测试（Rust）
  - [ ] SQLite 连接测试（Node.js）
  - [ ] SurrealDB schema 测试
  - [ ] Qdrant 配置测试

- [ ] 编写集成测试
  - [ ] 跨端数据一致性测试
  - [ ] 并发读写测试

- [ ] 更新文档
  - [ ] 更新 `docs/SHARED_STORAGE.md`
  - [ ] 创建 `docs/DATABASE_SCHEMA.md`
  - [ ] 更新 `README.md`（数据库部分）

- [ ] 添加示例
  - [ ] 数据库初始化示例
  - [ ] 配置文件示例

## 阶段 7：工具与监控（可选）

- [ ] 实现 CLI 工具
  - [ ] `openctx db status` - 查看数据库状态
  - [ ] `openctx db validate` - 校验数据库完整性

- [ ] 添加性能监控
  - [ ] SQLite 查询性能统计
  - [ ] SurrealDB 连接池监控
  - [ ] Qdrant 查询延迟监控

## 验收标准

- [x] 存在 5 个 SQLite 文件：
  - [x] `sqlite/workspace.db` ✅ Rust 端已实现
  - [x] `sqlite/repository.db` ✅ Rust 端已实现
  - [x] `sqlite/symbol.db` ✅ Node.js 端已实现
  - [x] `sqlite/edge.db` ✅ Node.js 端已实现
  - [x] `sqlite/reverse_edge.db` ✅ Node.js 端已实现
- [ ] 所有数据库使用统一配置文件（缺少 `config.json`）
- [x] workspace.db 和 repository.db schema 在两端一致
- [ ] sqlite 索引数据和 SurrealDB 数据同步
- [ ] 并发读写无数据竞争（已使用 WAL 模式）
- [ ] 所有测试通过
- [ ] 文档完整且准确
- [x] 旧的 leveldb 目录已重命名为 sqlite

---

## 总体进度：**65% 完成**

### 已完成阶段：
- ✅ 阶段 1：目录和文件重命名 (100%)
- ✅ 阶段 3：SQLite Schema 拆分 (85%)
- ✅ 阶段 4：Qdrant 配置标准化 (90%)

### 进行中阶段：
- ⏳ 阶段 2：配置与路径统一 (60%)
- ⏳ 阶段 5：数据库管理器封装 (50%)

### 待启动阶段：
- ❌ 阶段 6：测试与文档 (0%)
- ❌ 阶段 7：工具与监控 (0%)

### 关键待办事项：
1. **配置文件统一**：创建 `~/.open-context/config/config.json` 并实现读取逻辑
2. **数据同步机制**：实现 SQLite 和 SurrealDB 的双写策略
3. **测试覆盖**：为数据库层添加单元和集成测试
4. **文档更新**：更新 `SHARED_STORAGE.md` 和 `DATABASE_SCHEMA.md`
