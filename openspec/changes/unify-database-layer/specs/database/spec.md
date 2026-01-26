# 数据库架构规范

## 新增需求

### 需求：按业务拆分 SQLite 数据库

系统必须将 SQLite 数据库按业务职责拆分为 5 个独立的数据库文件，避免单文件性能瓶颈和锁竞争。

#### 场景：工作空间数据隔离

**给定** 用户在 open-app 中管理工作空间、笔记、文件、链接

**当** 用户创建/更新/删除这些资源时

**那么** 所有操作仅访问 `sqlite/workspace.db`，不影响其他数据库

**并且** open-node 可以只读查询 workspace 信息

#### 场景：仓库和索引任务隔离

**给定** 系统需要管理 Git 仓库和索引任务

**当** open-node 执行索引任务时

**那么** 所有索引相关元数据操作仅访问 `sqlite/repository.db`

**并且** open-app 可以查询仓库基础信息

#### 场景：符号数据高频访问

**给定** 索引系统需要存储大量符号数据

**当** 查询符号信息时

**那么** 使用 KV 存储模式访问 `sqlite/symbol.db`，O(1) 查询

**并且** 不与业务数据库产生锁竞争

#### 场景：图关系正向查询

**给定** 需要查询符号的依赖关系

**当** 查询 "A 依赖哪些符号" 时

**那么** 直接从 `sqlite/edge.db` 获取正向边数据

**并且** 返回目标符号 ID 数组

#### 场景：图关系反向查询

**给定** 需要查询符号被哪些其他符号引用

**当** 查询 "哪些符号依赖 A" 时

**那么** 直接从 `sqlite/reverse_edge.db` 获取反向边数据

**并且** 返回来源符号 ID 数组

### 需求：统一数据库存储路径

所有 SQLite 数据库文件必须存储在统一的 `sqlite/` 目录下，替换原有的 `leveldb/` 目录。

#### 场景：初始化数据库目录

**给定** 应用首次启动

**当** 初始化存储目录时

**那么** 创建 `~/.open-context/database/sqlite/` 目录

**并且** 在该目录下创建 5 个数据库文件

#### 场景：从旧版本升级

**给定** 旧版本使用 `leveldb/` 目录

**当** 应用升级到新版本时

**那么** 自动重命名 `leveldb/` 为 `sqlite/`

**并且** 重命名数据库文件：
- `main.sqlite` → `symbol.db`
- `edges.sqlite` → `edge.db`
- `reverse-edges.sqlite` → `reverse_edge.db`

### 需求：workspace.db 管理业务核心数据

workspace.db 必须存储工作空间、笔记、文件、链接等用户业务数据。

#### 场景：创建工作空间

**给定** 用户在 open-app 中创建工作空间

**当** 插入 workspace 记录时

**那么** 数据写入 `sqlite/workspace.db` 的 `workspaces` 表

**并且** 返回工作空间 ID

#### 场景：查询笔记列表

**给定** 工作空间包含多个笔记

**当** 用户查询笔记列表时

**那么** 从 `sqlite/workspace.db` 的 `notes` 表查询

**并且** 支持按 `workspace_id` 过滤

**并且** 支持按 `updated_at` 排序

### 需求：repository.db 管理索引任务

repository.db 必须存储 Git 仓库、索引任务、索引元数据。

#### 场景：创建索引任务

**给定** open-node 需要索引一个仓库

**当** 创建索引任务时

**那么** 在 `sqlite/repository.db` 的 `index_jobs` 表插入记录

**并且** 设置任务状态为 `pending`

**并且** 返回任务 ID

#### 场景：更新索引进度

**给定** 索引任务正在执行

**当** 索引进度更新时

**那么** 更新 `index_jobs` 表的 `progress` 字段

**并且** 不影响其他数据库的性能

#### 场景：记录文件索引元数据

**给定** 文件已被索引

**当** 记录索引元数据时

**那么** 在 `index_metadata` 表插入记录

**并且** 包含 `content_hash`、`last_indexed_at`、`symbol_count`

**并且** 使用 `(repo_id, file_path)` 作为唯一索引

### 需求：symbol.db 提供高性能符号查询

symbol.db 必须使用 KV 存储模式，提供 O(1) 复杂度的符号查询。

#### 场景：存储符号数据

**给定** 索引器提取了符号信息

**当** 存储符号时

**那么** 使用键 `symbol:{symbolId}` 存储到 `sqlite/symbol.db`

**并且** 值为 JSON 格式的 SymbolPayload

#### 场景：查询符号信息

**给定** 需要获取符号详细信息

**当** 通过 symbolId 查询时

**那么** 从 `sqlite/symbol.db` 获取 JSON 数据

**并且** 查询复杂度为 O(1)

### 需求：edge.db 和 reverse_edge.db 优化图查询

边数据库必须分离存储正向边和反向边，优化不同方向的图查询。

#### 场景：存储正向依赖边

**给定** 符号 A 依赖符号 B 和 C

**当** 存储依赖关系时

**那么** 在 `sqlite/edge.db` 存储键 `{symbolA}:IMPORTS`

**并且** 值为 `["symbolB", "symbolC"]`

#### 场景：存储反向依赖边

**给定** 符号 B 被符号 A 和 D 依赖

**当** 存储反向依赖时

**那么** 在 `sqlite/reverse_edge.db` 存储键 `{symbolB}:IMPORTS`

**并且** 值为 `["symbolA", "symbolD"]`

#### 场景：正向图遍历

**给定** 需要查找 A 依赖的所有符号

**当** 执行正向遍历时

**那么** 从 `sqlite/edge.db` 获取 `{symbolA}:IMPORTS`

**并且** 递归查询依赖树

#### 场景：反向图遍历

**给定** 需要查找依赖 B 的所有符号

**当** 执行反向遍历时

**那么** 从 `sqlite/reverse_edge.db` 获取 `{symbolB}:IMPORTS`

**并且** 递归查询被依赖树

### 需求：统一配置管理

所有数据库连接配置必须从统一的配置文件读取。

#### 场景：读取 SQLite 配置

**给定** 配置文件 `~/.open-context/config/config.json`

**当** 应用启动时

**那么** 从 `database.sqlite` 节读取配置

**并且** 包含 WAL 模式、busy_timeout、cache_size 等参数

#### 场景：读取 SurrealDB 配置

**给定** 配置文件存在

**当** open-node 连接 SurrealDB 时

**那么** 从 `database.surrealdb` 节读取 URL、用户名、密码

**并且** 支持环境变量覆盖

#### 场景：读取 Qdrant 配置

**给定** 配置文件存在

**当** open-node 连接 Qdrant 时

**那么** 从 `database.qdrant` 节读取 URL、API key、向量维度

**并且** 支持环境变量覆盖

### 需求：数据库访问权限控制

不同应用模块必须按照职责访问相应的数据库。

#### 场景：open-app 访问业务数据

**给定** open-app 需要管理用户数据

**当** 执行业务操作时

**那么** 可以读写 `workspace.db` 和 `repository.db`

**并且** 不能访问 `symbol.db`、`edge.db`、`reverse_edge.db`

#### 场景：open-node 访问索引数据

**给定** open-node 需要执行索引任务

**当** 索引代码时

**那么** 可以读写所有 5 个 SQLite 数据库

**并且** 只读查询 `workspace.db` 的基础信息

### 需求：WAL 模式并发优化

所有 SQLite 数据库必须启用 WAL 模式，支持并发读写。

#### 场景：启用 WAL 模式

**给定** 数据库文件被创建

**当** 初始化连接时

**那么** 执行 `PRAGMA journal_mode = WAL`

**并且** 设置 `busy_timeout = 5000`

**并且** 设置 `synchronous = NORMAL`

#### 场景：并发读写不阻塞

**给定** open-app 正在读取 workspace 数据

**当** open-node 同时写入 repository 数据时

**那么** 两个操作不互相阻塞

**并且** 单个数据库内的读写也支持并发

### 需求：数据同步机制

索引数据必须同步到 SurrealDB，实现持久化和全文检索。

#### 场景：符号数据双写

**给定** 索引器提取了符号

**当** 写入 `symbol.db` 时

**那么** 同时写入 SurrealDB 的 `symbol` 表

**并且** 使用相同的 symbolId

#### 场景：边数据双写

**给定** 构建了依赖关系图

**当** 写入 `edge.db` 和 `reverse_edge.db` 时

**那么** 同时在 SurrealDB 创建关系边（IMPORTS/CALLS/EXTENDS 等）

**并且** 支持图查询

#### 场景：数据一致性校验

**给定** sqlite 和 SurrealDB 都存储了索引数据

**当** 执行一致性检查时

**那么** 比较两边的符号数量和边数量

**并且** 报告不一致的记录

## 修改需求

### 需求：扩展 git_repositories 表

git_repositories 表必须添加索引状态相关字段。

#### 场景：记录索引状态

**给定** 仓库索引任务完成

**当** 更新仓库状态时

**那么** 设置 `index_status = 'indexed'`

**并且** 记录 `indexed_at` 时间戳

**并且** 记录 `symbol_count` 和 `vector_count`

## 移除需求

### 需求：废弃单一 app_state.db

不再使用单一的 app_state.db 存储所有业务数据。

#### 场景：迁移到拆分数据库

**给定** 旧版本使用 `app_state.db`

**当** 升级到新版本时

**那么** 将数据迁移到 `workspace.db` 和 `repository.db`

**并且** 删除旧的 `app_state.db` 文件
