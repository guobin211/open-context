# Database Schema

本文档描述 Open-Context 的数据库架构，包括 SQLite、SurrealDB 和 Qdrant 的详细 schema 设计。

## 目录

- [SQLite 数据库](#sqlite-数据库)
  - [workspace.db](#workspacedb)
  - [repository.db](#repositorydb)
  - [symbol.db](#symboldb)
  - [edge.db](#edgedb)
  - [reverse_edge.db](#reverse_edgedb)
- [SurrealDB 数据库](#surrealdb-数据库)
- [Qdrant 数据库](#qdrant-数据库)
- [数据流](#数据流)
- [并发控制](#并发控制)

## SQLite 数据库

所有 SQLite 数据库位于 `~/.open-context/database/sqlite/` 目录。

### workspace.db

管理工作空间、笔记、文件、链接等业务核心数据。

#### 表结构

**workspaces**

| 字段        | 类型    | 说明                    |
| ----------- | ------- | ----------------------- |
| id          | TEXT    | 工作空间 ID（主键）     |
| name        | TEXT    | 工作空间名称            |
| description | TEXT    | 工作空间描述            |
| icon        | TEXT    | 图标                    |
| color       | TEXT    | 颜色                    |
| sort_order  | INTEGER | 排序顺序                |
| is_active   | INTEGER | 是否激活（0/1）         |
| is_archived | INTEGER | 是否归档（0/1）         |
| created_at  | INTEGER | 创建时间（Unix 时间戳） |
| updated_at  | INTEGER | 更新时间（Unix 时间戳） |

**notes**

| 字段           | 类型    | 说明                    |
| -------------- | ------- | ----------------------- |
| id             | TEXT    | 笔记 ID（主键）         |
| workspace_id   | TEXT    | 所属工作空间 ID（外键） |
| parent_id      | TEXT    | 父笔记 ID（外键）       |
| title          | TEXT    | 笔记标题                |
| note_type      | TEXT    | 笔记类型                |
| content        | TEXT    | 笔记内容内容            |
| summary        | TEXT    | 笔记摘要                |
| file_path      | TEXT    | 文件存储路径            |
| tags           | TEXT    | 标签（JSON 数组）       |
| word_count     | INTEGER | 字数统计                |
| sort_order     | INTEGER | 排序顺序                |
| is_favorited   | INTEGER | 是否收藏（0/1）         |
| is_pinned      | INTEGER | 是否置顶（0/1）         |
| is_archived    | INTEGER | 是否归档（0/1）         |
| last_viewed_at | INTEGER | 最后查看时间            |
| created_at     | INTEGER | 创建时间                |
| updated_at     | INTEGER | 更新时间                |

**imported_files**

| 字段                | 类型    | 说明                    |
| ------------------- | ------- | ----------------------- |
| id                  | TEXT    | 文件 ID（主键）         |
| workspace_id        | TEXT    | 所属工作空间 ID（外键） |
| parent_directory_id | TEXT    | 父目录 ID（外键）       |
| name                | TEXT    | 文件名称                |
| original_path       | TEXT    | 原始文件路径            |
| stored_path         | TEXT    | 存储路径                |
| file_type           | TEXT    | 文件类型                |
| size_bytes          | INTEGER | 文件大小（字节）        |
| mime_type           | TEXT    | MIME 类型               |
| checksum            | TEXT    | 文件校验和              |
| is_archived         | INTEGER | 是否归档（0/1）         |
| created_at          | INTEGER | 创建时间                |
| updated_at          | INTEGER | 更新时间                |

**imported_directories**

| 字段             | 类型    | 说明                    |
| ---------------- | ------- | ----------------------- |
| id               | TEXT    | 目录 ID（主键）         |
| workspace_id     | TEXT    | 所属工作空间 ID（外键） |
| parent_id        | TEXT    | 父目录 ID（外键）       |
| name             | TEXT    | 目录名称                |
| original_path    | TEXT    | 原始目录路径            |
| stored_path      | TEXT    | 存储路径                |
| file_count       | INTEGER | 文件数量                |
| total_size_bytes | INTEGER | 总大小（字节）          |
| is_archived      | INTEGER | 是否归档（0/1）         |
| created_at       | INTEGER | 创建时间                |
| updated_at       | INTEGER | 更新时间                |

**web_links**

| 字段            | 类型    | 说明                    |
| --------------- | ------- | ----------------------- |
| id              | TEXT    | 链接 ID（主键）         |
| workspace_id    | TEXT    | 所属工作空间 ID（外键） |
| title           | TEXT    | 链接标题                |
| url             | TEXT    | 链接 URL                |
| description     | TEXT    | 链接描述                |
| favicon_url     | TEXT    | 图标 URL                |
| thumbnail_url   | TEXT    | 缩略图 URL              |
| tags            | TEXT    | 标签（JSON 数组）       |
| is_favorited    | INTEGER | 是否收藏（0/1）         |
| is_archived     | INTEGER | 是否归档（0/1）         |
| visit_count     | INTEGER | 访问次数                |
| last_visited_at | INTEGER | 最后访问时间            |
| created_at      | INTEGER | 创建时间                |
| updated_at      | INTEGER | 更新时间                |

**tasks**

| 字段           | 类型    | 说明              |
| -------------- | ------- | ----------------- |
| id             | TEXT    | 任务 ID（主键）   |
| task_type      | TEXT    | 任务类型          |
| status         | TEXT    | 任务状态          |
| progress       | INTEGER | 任务进度（0-100） |
| message        | TEXT    | 任务消息          |
| result         | TEXT    | 任务结果（JSON）  |
| error          | TEXT    | 错误信息          |
| retry_count    | INTEGER | 重试次数          |
| max_retries    | INTEGER | 最大重试次数      |
| retry_delay_ms | INTEGER | 重试延迟（毫秒）  |
| input          | TEXT    | 任务输入（JSON）  |
| persistent     | INTEGER | 是否持久化（0/1） |
| created_at     | INTEGER | 创建时间          |
| updated_at     | INTEGER | 更新时间          |
| completed_at   | INTEGER | 完成时间          |

### repository.db

管理 Git 仓库、索引任务、索引元数据。

#### 表结构

**git_repositories**

| 字段             | 类型    | 说明                    |
| ---------------- | ------- | ----------------------- |
| id               | TEXT    | 仓库 ID（主键）         |
| workspace_id     | TEXT    | 所属工作空间 ID（外键） |
| name             | TEXT    | 仓库名称                |
| remote_url       | TEXT    | 远程 URL                |
| local_path       | TEXT    | 本地路径                |
| branch           | TEXT    | 当前分支                |
| default_branch   | TEXT    | 默认分支                |
| last_commit_hash | TEXT    | 最后一次提交哈希        |
| last_synced_at   | INTEGER | 最后同步时间            |
| clone_status     | TEXT    | 克隆状态                |
| clone_progress   | INTEGER | 克隆进度（0-100）       |
| index_status     | TEXT    | 索引状态                |
| indexed_at       | INTEGER | 索引时间                |
| file_count       | INTEGER | 文件数量                |
| symbol_count     | INTEGER | 符号数量                |
| vector_count     | INTEGER | 向量数量                |
| is_archived      | INTEGER | 是否归档（0/1）         |
| created_at       | INTEGER | 创建时间                |
| updated_at       | INTEGER | 更新时间                |

**index_jobs**

| 字段              | 类型    | 说明                                      |
| ----------------- | ------- | ----------------------------------------- |
| id                | TEXT    | 任务 ID（主键）                           |
| repo_id           | TEXT    | 仓库 ID（外键）                           |
| job_type          | TEXT    | 任务类型（full/incremental/file/content） |
| status            | TEXT    | 任务状态                                  |
| progress          | INTEGER | 任务进度（0-100）                         |
| total_files       | INTEGER | 总文件数                                  |
| processed_files   | INTEGER | 已处理文件数                              |
| total_symbols     | INTEGER | 总符号数                                  |
| processed_symbols | INTEGER | 已处理符号数                              |
| error_message     | TEXT    | 错误信息                                  |
| metadata          | TEXT    | 元数据（JSON）                            |
| started_at        | INTEGER | 开始时间                                  |
| completed_at      | INTEGER | 完成时间                                  |
| created_at        | INTEGER | 创建时间                                  |

**index_metadata**

| 字段            | 类型    | 说明              |
| --------------- | ------- | ----------------- |
| id              | TEXT    | 元数据 ID（主键） |
| repo_id         | TEXT    | 仓库 ID（外键）   |
| file_path       | TEXT    | 文件路径          |
| content_hash    | TEXT    | 内容哈希          |
| last_indexed_at | INTEGER | 最后索引时间      |
| symbol_count    | INTEGER | 符号数量          |
| language        | TEXT    | 编程语言          |
| file_size       | INTEGER | 文件大小          |

唯一索引：(repo_id, file_path)

### symbol.db

使用 Keyv KV 存储模式存储符号数据。

- 键格式：`symbol:{symbolId}`
- 值格式：JSON (SymbolPayload)

### edge.db

存储正向依赖关系。

- 键格式：`{from}:{edgeType}`
- 值格式：JSON (string) - 目标符号 ID 数组

### reverse_edge.db

存储反向依赖关系（被依赖关系）。

- 键格式：`{to}:{edgeType}`
- 值格式：JSON (string) - 来源符号 ID 数组

## SurrealDB 数据库

SurrealDB 用于持久化符号数据和/关系边，支持全文检索和图查询。

### Namespace 和 Database

- Namespace: `code_index`
- Database: `open_context`

### symbol 表

| 字段         | 类型           | 说明                                |
| ------------ | -------------- | ----------------------------------- |
| workspace_id | string         | 工作空间 ID                         |
| repo_id      | string         | 仓库 ID                             |
| repo_name    | string         | 仓库名称                            |
| file_path    | string         | 文件路径                            |
| content_hash | string         | 内容哈希                            |
| symbol_id    | string         | 符号 ID                             |
| symbol_name  | string         | 符号名称                            |
| symbol_kind  | string         | 符号类型（function/class/method等） |
| code         | string         | 代码内容                            |
| signature    | option<string> | 函数签名                            |
| language     | string         | 编程语言                            |
| exported     | bool           | 是否导出                            |
| visibility   | string         | 可见性（public/private/protected）  |
| importance   | float          | 重要性（0.0-1.0）                   |
| commit       | string         | 提交哈希                            |
| indexed_at   | number         | 索引时间（Unix 时间戳）             |

### 索引

**全文索引 (BM25)**

- `symbol_name_idx`: 符号名称全文索引
- `code_idx`: 代码内容全文索引
- `signature_idx`: 函数签名全文索引

**唯一索引**

- `symbol_unique_idx`: (file_path, content_hash) 防止重复

**查询索引**

- `workspace_id_idx`: 工作空间 ID 过滤
- `repo_id_idx`: 仓库 ID 过滤
- `symbol_kind_idx`: 符号类型过滤
- `language_idx`: 编程语言过滤

### 关系边表

| 边类型     | 说明     |
| ---------- | -------- |
| IMPORTS    | 导入关系 |
| CALLS      | 调用关系 |
| IMPLEMENTS | 实现关系 |
| EXTENDS    | 继承关系 |
| USES       | 使用关系 |
| REFERENCES | 引用关系 |

所有关系边表都是 RELATION 类型，IN 和 OUT 都指向 symbol 表。

## Qdrant 数据库

Qdrant 用于向量嵌入和语义检索。

### Collection

- 名称：`code_symbols`
- 向量维度：1024（从配置文件读取）
- 距离度量：Cosine

### Payload Schema

| 字段         | 类型    | 说明                |
| ------------ | ------- | ------------------- |
| workspace_id | keyword | 工作空间 ID（过滤） |
| repo_id      | keyword | 仓库 ID（过滤）     |
| symbol_kind  | keyword | 符号类型（过滤）    |
| exported     | bool    | 是否导出（过滤）    |
| language     | keyword | 编程语言（过滤）    |
| importance   | float   | 重要性（排序）      |
| indexed_at   | integer | 索引时间（排序）    |

## 数据流

### 索引流程

```
代码文件
  → tree-sitter 解析
  → 提取符号信息
  → 写入 symbol.db (KV 存储)
  → 写入 edge.db / reverse_edge.db (图关系)
  → 写入 SurrealDB (持久化 + 全文索引)
  → 生成向量嵌入
  → 写入 Qdrant (向量检索)
  → 更新 repository.db (元数据)
```

### 查询流程

```
用户查询
  → 并发查询：
    ├→ Q.向量检索
    ├→ SurrealDB.全文检索
    └→ SurrealDB.图查询
  → 结果融合（权重排序、去重、Top-K）
  → 返回符号列表
```

## 并发控制

### SQLite

- WAL 模式：支持并发读写
- busy_timeout: 5000ms
- cache_size: 64MB
- mmap_size: 30GB

### 访问模式

| 数据库          | open-app | open-node | 并发控制     |
| --------------- | -------- | --------- | ------------ |
| workspace.db    | 读写     | 只读      | WAL 模式     |
| repository.db   | 读写     | 读写      | WAL 模式     |
| symbol.db       | 不访问   | 读写      | WAL 模式     |
| edge.db         | 不访问   | 读写      | WAL 模式     |
| reverse_edge.db | 不访问   | 读写      | WAL 模式     |
| SurrealDB       | 只读     | 读写      | 内置事务     |
| Qdrant          | 只读     | 读写      | 内置并发控制 |

## 数据一致性

- SQLite 和 SurrealDB 数据双写
- 定期数据一致性校验
- 使用 content_hash 检测重复和变更
