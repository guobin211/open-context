# 任务清单

## 阶段 1：目录和文件重命名

- [ ] 重命名数据库目录
  - [ ] 将 `~/.open-context/database/leveldb/` 重命名为 `~/.open-context/database/sqlite/`

- [ ] 重命名数据库文件
  - [ ] `main.sqlite` → `symbol.db`
  - [ ] `edges.sqlite` → `edge.db`
  - [ ] `reverse-edges.sqlite` → `reverse_edge.db`

- [ ] 更新配置路径
  - [ ] 修改 `apps/open-node/src/config/paths.ts` 中的路径配置
  - [ ] 将 `leveldb()` 改为 `sqlite()`

## 阶段 2：配置与路径统一

- [ ] 扩展 `~/.open-context/config/config.json` 配置文件
  - [ ] 添加 `database.sqlite` 配置节
  - [ ] 添加 `database.surrealdb` 配置节
  - [ ] 添加 `database.qdrant` 配置节
  - [ ] 支持环境变量覆盖

- [ ] 实现配置读取模块（Rust）
  - [ ] 在 `apps/open-app/src/app_state/app_config.rs` 中添加数据库配置结构
  - [ ] 添加配置校验逻辑
  - [ ] 支持默认值和自动配置生成

- [ ] 实现配置读取模块（Node.js）
  - [ ] 在 `apps/open-node/src/config/database-config.ts` 中读取统一配置
  - [ ] 添加配置校验和类型安全
  - [ ] 支持环境变量覆盖

- [ ] 标准化存储路径
  - [ ] 确保所有数据库连接使用 `~/.open-context/database/` 路径
  - [ ] 移除硬编码路径
  - [ ] 添加路径解析工具函数

## 阶段 3：SQLite Schema 拆分

- [ ] 分析现有 schema
  - [ ] 整理 open-app 现有表结构（`database.rs`）
  - [ ] 规划数据库拆分方案（workspace.db vs repository.db）
  - [ ] 识别表之间的依赖关系

- [ ] 拆分 Rust 端数据库
  - [ ] 拆分 `database.rs` 为 `workspace_db.rs` 和 `repository_db.rs`
  - [ ] `workspace.db` 包含：workspaces、notes、imported_files、imported_directories、web_links、tasks
  - [ ] `repository.db` 包含：git_repositories、index_jobs、index_metadata
  - [ ] 在 `state.rs` 中管理多个数据库连接
  - [ ] 更新相关索引

- [ ] 实现 Node.js 端数据库访问
  - [ ] 新增 `apps/open-node/src/db/workspace-db.ts`（使用 better-sqlite3 访问 workspace.db）
  - [ ] 新增 `apps/open-node/src/db/repository-db.ts`（使用 better-sqlite3 访问 repository.db）
  - [ ] 重命名 `sqlite-db.ts` 为 `index-db.ts`（访问 symbol/edge/reverse_edge）
  - [ ] 实现基础 CRUD 操作（workspaces、repos、jobs、metadata）

- [ ] 数据同步机制
  - [ ] sqlite 索引数据和 SurrealDB 双写策略
  - [ ] 数据一致性校验

- [ ] 标准化表定义
  - [ ] 确保 `symbol` 表字段完整
  - [ ] 添加必要的索引（全文、去重、workspace）
  - [ ] 定义所有关系边表（IMPORTS, CALLS, IMPLEMENTS, EXTENDS, USES, REFERENCES）

- [ ] 更新初始化脚本
  - [ ] 在 `apps/open-node/src/db/surrealdb-client.ts` 中更新 `initSchema()`
  - [ ] 确保 schema 定义完整
  - [ ] 添加索引优化

- [ ] 添加 Rust 端只读访问（可选）
  - [ ] 在 `apps/open-app/Cargo.toml` 中添加 `surrealdb` 依赖
  - [ ] 实现基础查询封装
  - [ ] 添加健康检查

## 阶段 4：Qdrant 配置标准化

- [ ] 统一 collection 配置
  - [ ] 确保使用统一的 collection 名称 `code_symbols`
  - [ ] 从配置文件读取向量维度
  - [ ] 标准化距离度量为 Cosine

- [ ] 实现健康检查
  - [ ] 添加连接测试函数 `isHealthy()`
  - [ ] 实现自动重连机制
  - [ ] 添加连接池管理

- [ ] 优化 payload 索引
  - [ ] 确保所有必要字段都有索引
  - [ ] 添加索引创建脚本
  - [ ] 验证索引性能

## 阶段 5：数据库管理器封装

- [ ] 实现统一数据库管理器（Node.js）
  - [ ] 创建 `apps/open-node/src/db/database-manager.ts`
  - [ ] 封装 SQLite、SurrealDB、Qdrant 连接
  - [ ] 实现统一的初始化流程
  - [ ] 添加关闭和清理逻辑

- [ ] 实现 Tauri 命令（Rust）
  - [ ] 添加 `database_status` 命令（查询数据库状态）
  - [ ] 添加 `validate_database` 命令（校验数据库一致性）

- [ ] 添加错误处理
  - [ ] 统一错误类型定义
  - [ ] 添加详细错误日志
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

- [ ] 存在 5 个 SQLite 文件：
  - [ ] `sqlite/workspace.db`
  - [ ] `sqlite/repository.db`
  - [ ] `sqlite/symbol.db`
  - [ ] `sqlite/edge.db`
  - [ ] `sqlite/reverse_edge.db`
- [ ] 所有数据库使用统一配置文件
- [ ] workspace.db 和 repository.db schema 在两端一致
- [ ] sqlite 索引数据和 SurrealDB 数据同步
- [ ] 并发读写无数据竞争
- [ ] 所有测试通过
- [ ] 文档完整且准确
- [ ] 旧的 leveldb 目录已重命名为 sqlite
