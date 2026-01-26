# Database Schema 文档

本文档详细说明 Open-Context 项目的数据库架构和表结构。

## 概述

Open-Context 使用多种数据库来存储不同类型的数据：

| 数据库              | 用途                 | 访问模式       | 技术栈    |
| ------------------- | -------------------- | -------------- | --------- |
| **app.db**          | 业务核心数据         | 双端读写       | SQLite    |
| **symbol.db**       | 符号数据（KV 存储）  | open-node 读写 | SQLite    |
| **edge.db**         | 正向边（依赖关系图） | open-node 读写 | SQLite    |
| **reverse_edge.db** | 反向边（被依赖关系） | open-node 读写 | SQLite    |
| **SurrealDB**       | 图数据、全文检索     | open-node 读写 | SurrealDB |
| **Qdrant**          | 向量嵌入、语义检索   | open-node 读写 | Qdrant    |

## 数据类型分类

### 原子类型（知识库基础单元）

| 类型           | 对应表             | 说明                             |
| -------------- | ------------------ | -------------------------------- |
| `file`         | imported_files     | 导入的文件对象                   |
| `folder`       | imported_directories | 导入的文件夹对象               |
| `link`         | web_links          | 网页链接                         |
| `note`         | notes              | 笔记对象                         |
| `repo`         | git_repositories   | 代码仓库对象                     |
| `conversation` | conversations      | 会话对象，包含参与者、消息记录等 |

### 界面交互类型

| 类型       | 对应表    | 说明                               |
| ---------- | --------- | ---------------------------------- |
| `terminal` | terminals | 终端会话，包含命令历史、当前目录等 |
| `webview`  | webviews  | 网页视图，包含 URL、加载状态等     |
| `chat`     | chats     | 聊天对象，包含多个会话             |

### 复合类型

| 类型        | 对应表     | 说明                                 |
| ----------- | ---------- | ------------------------------------ |
| `workspace` | workspaces | 工作区对象，可包含多个原子类型的组合 |

## SQLite 数据库 - app.db

### 表：workspaces

工作空间表，作为复合类型容器，关联多种原子类型。

| 字段        | 类型    | 约束               | 说明                    |
| ----------- | ------- | ------------------ | ----------------------- |
| id          | TEXT    | PRIMARY KEY        | 工作空间 ID（ULID）     |
| name        | TEXT    | NOT NULL           | 工作空间名称            |
| description | TEXT    | NULL               | 描述                    |
| icon        | TEXT    | NULL               | 图标（emoji 或 URL）    |
| color       | TEXT    | NULL               | 主题颜色（十六进制）    |
| sort_order  | INTEGER | NOT NULL DEFAULT 0 | 排序顺序                |
| is_active   | INTEGER | NOT NULL DEFAULT 0 | 是否激活（当前使用）    |
| is_archived | INTEGER | NOT NULL DEFAULT 0 | 是否归档                |
| settings    | TEXT    | NULL               | 工作区设置（JSON）      |
| created_at  | INTEGER | NOT NULL           | 创建时间（Unix 时间戳） |
| updated_at  | INTEGER | NOT NULL           | 更新时间（Unix 时间戳） |

**索引**：
- `idx_workspaces_active` - is_active
- `idx_workspaces_archived` - is_archived
- `idx_workspaces_sort` - sort_order

---

### 表：notes

笔记表，原子类型，支持层级结构。

| 字段           | 类型    | 约束                      | 说明                              |
| -------------- | ------- | ------------------------- | --------------------------------- |
| id             | TEXT    | PRIMARY KEY               | 笔记 ID（ULID）                   |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces)  | 所属工作空间 ID                   |
| parent_id      | TEXT    | NULL, FK(notes)           | 父笔记 ID（支持层级）             |
| title          | TEXT    | NOT NULL                  | 笔记标题                          |
| note_type      | TEXT    | NOT NULL                  | 笔记类型（markdown/richtext/canvas） |
| content        | TEXT    | NOT NULL DEFAULT ''       | 笔记内容                          |
| summary        | TEXT    | NULL                      | AI 生成摘要                       |
| file_path      | TEXT    | NOT NULL                  | 笔记文件存储路径                  |
| tags           | TEXT    | NULL                      | 标签（JSON 数组）                 |
| word_count     | INTEGER | NOT NULL DEFAULT 0        | 字数统计                          |
| sort_order     | INTEGER | NOT NULL DEFAULT 0        | 同级排序顺序                      |
| is_favorited   | INTEGER | NOT NULL DEFAULT 0        | 是否收藏                          |
| is_pinned      | INTEGER | NOT NULL DEFAULT 0        | 是否置顶                          |
| is_archived    | INTEGER | NOT NULL DEFAULT 0        | 是否归档                          |
| last_viewed_at | INTEGER | NULL                      | 最后查看时间                      |
| created_at     | INTEGER | NOT NULL                  | 创建时间                          |
| updated_at     | INTEGER | NOT NULL                  | 更新时间                          |

**索引**：
- `idx_notes_workspace` - workspace_id
- `idx_notes_parent` - parent_id
- `idx_notes_workspace_type` - (workspace_id, note_type)
- `idx_notes_workspace_favorited` - (workspace_id, is_favorited)
- `idx_notes_workspace_pinned` - (workspace_id, is_pinned)
- `idx_notes_workspace_archived` - (workspace_id, is_archived)
- `idx_notes_workspace_updated` - (workspace_id, updated_at DESC)
- `idx_notes_workspace_viewed` - (workspace_id, last_viewed_at DESC)

---

### 表：imported_files

导入文件表，原子类型。

| 字段                | 类型    | 约束                               | 说明               |
| ------------------- | ------- | ---------------------------------- | ------------------ |
| id                  | TEXT    | PRIMARY KEY                        | 文件 ID（ULID）    |
| workspace_id        | TEXT    | NOT NULL, FK(workspaces)           | 所属工作空间 ID    |
| parent_directory_id | TEXT    | NULL, FK(imported_directories)     | 父目录 ID          |
| name                | TEXT    | NOT NULL                           | 文件名             |
| original_path       | TEXT    | NOT NULL                           | 原始路径           |
| stored_path         | TEXT    | NOT NULL                           | 存储路径           |
| file_type           | TEXT    | NOT NULL                           | 文件类型（扩展名） |
| size_bytes          | INTEGER | NOT NULL                           | 文件大小（字节）   |
| mime_type           | TEXT    | NULL                               | MIME 类型          |
| checksum            | TEXT    | NULL                               | SHA256 校验和      |
| is_archived         | INTEGER | NOT NULL DEFAULT 0                 | 是否归档           |
| created_at          | INTEGER | NOT NULL                           | 创建时间           |
| updated_at          | INTEGER | NOT NULL                           | 更新时间           |

**索引**：
- `idx_files_workspace` - workspace_id
- `idx_files_parent` - parent_directory_id
- `idx_files_workspace_type` - (workspace_id, file_type)
- `idx_files_checksum` - checksum
- `idx_files_workspace_archived` - (workspace_id, is_archived)

---

### 表：imported_directories

导入目录表，原子类型（folder）。

| 字段             | 类型    | 约束                           | 说明             |
| ---------------- | ------- | ------------------------------ | ---------------- |
| id               | TEXT    | PRIMARY KEY                    | 目录 ID（ULID）  |
| workspace_id     | TEXT    | NOT NULL, FK(workspaces)       | 所属工作空间 ID  |
| parent_id        | TEXT    | NULL, FK(imported_directories) | 父目录 ID        |
| name             | TEXT    | NOT NULL                       | 目录名           |
| original_path    | TEXT    | NOT NULL                       | 原始路径         |
| stored_path      | TEXT    | NOT NULL                       | 存储路径         |
| file_count       | INTEGER | NOT NULL DEFAULT 0             | 包含文件数量     |
| total_size_bytes | INTEGER | NOT NULL DEFAULT 0             | 总大小（字节）   |
| is_archived      | INTEGER | NOT NULL DEFAULT 0             | 是否归档         |
| created_at       | INTEGER | NOT NULL                       | 创建时间         |
| updated_at       | INTEGER | NOT NULL                       | 更新时间         |

**索引**：
- `idx_dirs_workspace` - workspace_id
- `idx_dirs_parent` - parent_id
- `idx_dirs_workspace_archived` - (workspace_id, is_archived)

---

### 表：web_links

网页链接表，原子类型（link）。

| 字段            | 类型    | 约束                     | 说明            |
| --------------- | ------- | ------------------------ | --------------- |
| id              | TEXT    | PRIMARY KEY              | 链接 ID（ULID） |
| workspace_id    | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID |
| title           | TEXT    | NOT NULL                 | 链接标题        |
| url             | TEXT    | NOT NULL                 | 链接 URL        |
| description     | TEXT    | NULL                     | 描述            |
| favicon_url     | TEXT    | NULL                     | 网站图标 URL    |
| thumbnail_url   | TEXT    | NULL                     | 缩略图 URL      |
| tags            | TEXT    | NULL                     | 标签（JSON）    |
| content         | TEXT    | NULL                     | 抓取的网页内容  |
| is_favorited    | INTEGER | NOT NULL DEFAULT 0       | 是否收藏        |
| is_archived     | INTEGER | NOT NULL DEFAULT 0       | 是否归档        |
| visit_count     | INTEGER | NOT NULL DEFAULT 0       | 访问次数        |
| last_visited_at | INTEGER | NULL                     | 最后访问时间    |
| created_at      | INTEGER | NOT NULL                 | 创建时间        |
| updated_at      | INTEGER | NOT NULL                 | 更新时间        |

**索引**：
- `idx_links_workspace` - workspace_id
- `idx_links_workspace_favorited` - (workspace_id, is_favorited)
- `idx_links_workspace_archived` - (workspace_id, is_archived)
- `idx_links_workspace_visited` - (workspace_id, last_visited_at DESC)
- `idx_links_url` - url

---

### 表：git_repositories

Git 仓库表，原子类型（repo）。

| 字段             | 类型    | 约束                           | 说明                   |
| ---------------- | ------- | ------------------------------ | ---------------------- |
| id               | TEXT    | PRIMARY KEY                    | 仓库 ID（ULID）        |
| workspace_id     | TEXT    | NOT NULL, FK(workspaces)       | 所属工作空间 ID        |
| name             | TEXT    | NOT NULL                       | 仓库名称               |
| remote_url       | TEXT    | NOT NULL                       | 远程 URL               |
| local_path       | TEXT    | NOT NULL                       | 本地路径               |
| branch           | TEXT    | NOT NULL                       | 当前分支               |
| default_branch   | TEXT    | NULL                           | 默认分支               |
| last_commit_hash | TEXT    | NULL                           | 最后提交哈希           |
| last_synced_at   | INTEGER | NULL                           | 最后同步时间           |
| clone_status     | TEXT    | NOT NULL DEFAULT 'pending'     | 克隆状态               |
| clone_progress   | INTEGER | NOT NULL DEFAULT 0             | 克隆进度（0-100）      |
| index_status     | TEXT    | NOT NULL DEFAULT 'not_indexed' | 索引状态               |
| indexed_at       | INTEGER | NULL                           | 索引完成时间           |
| file_count       | INTEGER | NOT NULL DEFAULT 0             | 文件数量               |
| symbol_count     | INTEGER | NOT NULL DEFAULT 0             | 符号数量               |
| vector_count     | INTEGER | NOT NULL DEFAULT 0             | 向量数量               |
| is_archived      | INTEGER | NOT NULL DEFAULT 0             | 是否归档               |
| created_at       | INTEGER | NOT NULL                       | 创建时间               |
| updated_at       | INTEGER | NOT NULL                       | 更新时间               |

**clone_status 枚举值**：pending、cloning、completed、failed
**index_status 枚举值**：not_indexed、indexing、indexed、failed

**索引**：
- `idx_repos_workspace` - workspace_id
- `idx_repos_clone_status` - clone_status
- `idx_repos_index_status` - index_status
- `idx_repos_workspace_archived` - (workspace_id, is_archived)

---

### 表：conversations

会话表，原子类型（conversation），用于 AI 对话记录。

| 字段           | 类型    | 约束                     | 说明               |
| -------------- | ------- | ------------------------ | ------------------ |
| id             | TEXT    | PRIMARY KEY              | 会话 ID（ULID）    |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID    |
| chat_id        | TEXT    | NULL, FK(chats)          | 所属聊天 ID        |
| title          | TEXT    | NOT NULL                 | 会话标题           |
| model          | TEXT    | NULL                     | 使用的 AI 模型     |
| system_prompt  | TEXT    | NULL                     | 系统提示词         |
| messages       | TEXT    | NOT NULL DEFAULT '[]'    | 消息记录（JSON）   |
| message_count  | INTEGER | NOT NULL DEFAULT 0       | 消息数量           |
| token_count    | INTEGER | NOT NULL DEFAULT 0       | Token 使用量       |
| is_favorited   | INTEGER | NOT NULL DEFAULT 0       | 是否收藏           |
| is_archived    | INTEGER | NOT NULL DEFAULT 0       | 是否归档           |
| last_active_at | INTEGER | NULL                     | 最后活跃时间       |
| created_at     | INTEGER | NOT NULL                 | 创建时间           |
| updated_at     | INTEGER | NOT NULL                 | 更新时间           |

**messages JSON 结构**：
```json
[
  {
    "id": "msg_001",
    "role": "user|assistant|system",
    "content": "消息内容",
    "timestamp": 1706000000,
    "metadata": {}
  }
]
```

**索引**：
- `idx_conversations_workspace` - workspace_id
- `idx_conversations_chat` - chat_id
- `idx_conversations_workspace_favorited` - (workspace_id, is_favorited)
- `idx_conversations_workspace_archived` - (workspace_id, is_archived)
- `idx_conversations_workspace_active` - (workspace_id, last_active_at DESC)

---

### 表：terminals

终端会话表，界面交互类型。

| 字段            | 类型    | 约束                     | 说明                |
| --------------- | ------- | ------------------------ | ------------------- |
| id              | TEXT    | PRIMARY KEY              | 终端 ID（ULID）     |
| workspace_id    | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID     |
| name            | TEXT    | NOT NULL                 | 终端名称            |
| shell           | TEXT    | NOT NULL                 | Shell 类型          |
| cwd             | TEXT    | NOT NULL                 | 当前工作目录        |
| env             | TEXT    | NULL                     | 环境变量（JSON）    |
| history         | TEXT    | NOT NULL DEFAULT '[]'    | 命令历史（JSON）    |
| history_count   | INTEGER | NOT NULL DEFAULT 0       | 历史命令数量        |
| is_active       | INTEGER | NOT NULL DEFAULT 0       | 是否活跃            |
| is_archived     | INTEGER | NOT NULL DEFAULT 0       | 是否归档            |
| last_command_at | INTEGER | NULL                     | 最后命令执行时间    |
| created_at      | INTEGER | NOT NULL                 | 创建时间            |
| updated_at      | INTEGER | NOT NULL                 | 更新时间            |

**索引**：
- `idx_terminals_workspace` - workspace_id
- `idx_terminals_workspace_active` - (workspace_id, is_active)

---

### 表：webviews

网页视图表，界面交互类型。

| 字段           | 类型    | 约束                     | 说明                 |
| -------------- | ------- | ------------------------ | -------------------- |
| id             | TEXT    | PRIMARY KEY              | 视图 ID（ULID）      |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID      |
| title          | TEXT    | NOT NULL                 | 页面标题             |
| url            | TEXT    | NOT NULL                 | 当前 URL             |
| favicon_url    | TEXT    | NULL                     | 图标 URL             |
| history        | TEXT    | NOT NULL DEFAULT '[]'    | 浏览历史（JSON）     |
| is_loading     | INTEGER | NOT NULL DEFAULT 0       | 是否加载中           |
| is_active      | INTEGER | NOT NULL DEFAULT 0       | 是否活跃             |
| is_archived    | INTEGER | NOT NULL DEFAULT 0       | 是否归档             |
| scroll_x       | INTEGER | NOT NULL DEFAULT 0       | 水平滚动位置         |
| scroll_y       | INTEGER | NOT NULL DEFAULT 0       | 垂直滚动位置         |
| zoom_level     | REAL    | NOT NULL DEFAULT 1.0     | 缩放级别             |
| last_active_at | INTEGER | NULL                     | 最后活跃时间         |
| created_at     | INTEGER | NOT NULL                 | 创建时间             |
| updated_at     | INTEGER | NOT NULL                 | 更新时间             |

**索引**：
- `idx_webviews_workspace` - workspace_id
- `idx_webviews_workspace_active` - (workspace_id, is_active)

---

### 表：chats

聊天表，界面交互类型，包含多个会话。

| 字段               | 类型    | 约束                     | 说明                |
| ------------------ | ------- | ------------------------ | ------------------- |
| id                 | TEXT    | PRIMARY KEY              | 聊天 ID（ULID）     |
| workspace_id       | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID     |
| name               | TEXT    | NOT NULL                 | 聊天名称            |
| description        | TEXT    | NULL                     | 描述                |
| default_model      | TEXT    | NULL                     | 默认 AI 模型        |
| default_prompt     | TEXT    | NULL                     | 默认系统提示词      |
| conversation_count | INTEGER | NOT NULL DEFAULT 0       | 会话数量            |
| is_active          | INTEGER | NOT NULL DEFAULT 0       | 是否活跃            |
| is_archived        | INTEGER | NOT NULL DEFAULT 0       | 是否归档            |
| last_active_at     | INTEGER | NULL                     | 最后活跃时间        |
| created_at         | INTEGER | NOT NULL                 | 创建时间            |
| updated_at         | INTEGER | NOT NULL                 | 更新时间            |

**索引**：
- `idx_chats_workspace` - workspace_id
- `idx_chats_workspace_active` - (workspace_id, is_active)
- `idx_chats_workspace_active_time` - (workspace_id, last_active_at DESC)

---

### 表：tasks

异步任务表，用于跟踪后台任务状态。

| 字段           | 类型    | 约束                       | 说明                    |
| -------------- | ------- | -------------------------- | ----------------------- |
| id             | TEXT    | PRIMARY KEY                | 任务 ID（ULID）         |
| task_type      | TEXT    | NOT NULL                   | 任务类型                |
| status         | TEXT    | NOT NULL DEFAULT 'pending' | 任务状态                |
| progress       | INTEGER | NOT NULL DEFAULT 0         | 进度（0-100）           |
| message        | TEXT    | NULL                       | 状态消息                |
| result         | TEXT    | NULL                       | 任务结果（JSON）        |
| error          | TEXT    | NULL                       | 错误信息                |
| retry_count    | INTEGER | NOT NULL DEFAULT 0         | 已重试次数              |
| max_retries    | INTEGER | NOT NULL DEFAULT 3         | 最大重试次数            |
| retry_delay_ms | INTEGER | NOT NULL DEFAULT 1000      | 重试延迟（毫秒）        |
| input          | TEXT    | NULL                       | 任务输入（JSON）        |
| persistent     | INTEGER | NOT NULL DEFAULT 0         | 是否持久化              |
| created_at     | INTEGER | NOT NULL                   | 创建时间                |
| updated_at     | INTEGER | NOT NULL                   | 更新时间                |
| completed_at   | INTEGER | NULL                       | 完成时间                |

**status 枚举值**：pending、running、completed、failed、cancelled

**索引**：
- `idx_tasks_status` - status
- `idx_tasks_type` - task_type
- `idx_tasks_persistent` - persistent
- `idx_tasks_created_at` - created_at

---

### 表：index_jobs

索引任务表，记录代码索引作业的状态和进度（双端读写）。

| 字段              | 类型    | 约束                          | 说明                          |
| ----------------- | ------- | ----------------------------- | ----------------------------- |
| id                | TEXT    | PRIMARY KEY                   | 任务 ID（ULID）               |
| repo_id           | TEXT    | NOT NULL, FK(git_repositories) | 仓库 ID                      |
| job_type          | TEXT    | NOT NULL                      | 任务类型（full/incremental）  |
| status            | TEXT    | NOT NULL DEFAULT 'pending'    | 任务状态                      |
| progress          | INTEGER | NOT NULL DEFAULT 0            | 进度（0-100）                 |
| total_files       | INTEGER | NULL                          | 总文件数                      |
| processed_files   | INTEGER | NOT NULL DEFAULT 0            | 已处理文件数                  |
| total_symbols     | INTEGER | NULL                          | 总符号数                      |
| processed_symbols | INTEGER | NOT NULL DEFAULT 0            | 已处理符号数                  |
| error_message     | TEXT    | NULL                          | 错误信息                      |
| metadata          | TEXT    | NULL                          | 元数据（JSON）                |
| started_at        | INTEGER | NULL                          | 开始时间                      |
| completed_at      | INTEGER | NULL                          | 完成时间                      |
| created_at        | INTEGER | NOT NULL                      | 创建时间                      |

**job_type 枚举值**：full、incremental
**status 枚举值**：pending、running、completed、failed、cancelled

**索引**：
- `idx_index_jobs_repo` - repo_id
- `idx_index_jobs_status` - status
- `idx_index_jobs_repo_status` - (repo_id, status)

---

### 表：index_metadata

索引元数据表，记录文件的索引状态和内容哈希（双端读写）。

| 字段            | 类型    | 约束                          | 说明               |
| --------------- | ------- | ----------------------------- | ------------------ |
| id              | TEXT    | PRIMARY KEY                   | 元数据 ID（ULID）  |
| repo_id         | TEXT    | NOT NULL, FK(git_repositories) | 仓库 ID           |
| file_path       | TEXT    | NOT NULL                      | 文件路径           |
| content_hash    | TEXT    | NOT NULL                      | 内容哈希（SHA256） |
| last_indexed_at | INTEGER | NOT NULL                      | 最后索引时间       |
| symbol_count    | INTEGER | NOT NULL DEFAULT 0            | 符号数量           |
| language        | TEXT    | NULL                          | 文件语言           |
| file_size       | INTEGER | NULL                          | 文件大小（字节）   |

**索引**：
- `idx_index_metadata_repo` - repo_id
- `idx_index_metadata_repo_path` - (repo_id, file_path) UNIQUE
- `idx_index_metadata_hash` - content_hash

---

## SQLite 数据库 - symbol.db

符号数据表，使用 KV 存储模式（由 open-node 管理）。

| 字段  | 类型 | 说明                 |
| ----- | ---- | -------------------- |
| key   | TEXT | 键（symbol:{id}）    |
| value | TEXT | 符号数据（JSON）     |

**键格式**：`symbol:{symbolId}`

---

## SQLite 数据库 - edge.db

正向边表，存储依赖关系图（由 open-node 管理）。

| 字段  | 类型 | 说明                       |
| ----- | ---- | -------------------------- |
| key   | TEXT | 边键（{from}:{edgeType}）  |
| value | TEXT | 目标符号 ID 列表（JSON）   |

---

## SQLite 数据库 - reverse_edge.db

反向边表，存储被依赖关系（由 open-node 管理）。

| 字段  | 类型 | 说明                       |
| ----- | ---- | -------------------------- |
| key   | TEXT | 边键（{to}:{edgeType}）    |
| value | TEXT | 来源符号 ID 列表（JSON）   |

---

## SurrealDB

SurrealDB 用于存储图数据和全文检索（由 open-node 管理）。

### 表：symbol

| 字段         | 类型   | 约束        | 说明            |
| ------------ | ------ | ----------- | --------------- |
| id           | string | PRIMARY KEY | 符号 ID         |
| workspace_id | string | NOT NULL    | 所属工作空间 ID |
| repo_id      | string | NOT NULL    | 仓库 ID         |
| file_path    | string | NOT NULL    | 文件路径        |
| content_hash | string | NOT NULL    | 内容哈希        |
| symbol_id    | string | NOT NULL    | 符号 ID         |
| symbol_name  | string | NOT NULL    | 符号名称        |
| symbol_kind  | string | NOT NULL    | 符号类型        |
| code         | string | NOT NULL    | 代码内容        |
| language     | string | NOT NULL    | 编程语言        |

**索引**：
- `symbol_name_idx` - BM25 全文索引
- `code_idx` - BM25 全文索引
- `symbol_unique_idx` - (file_path, content_hash) UNIQUE

### 关系表

| 表名       | 说明     |
| ---------- | -------- |
| IMPORTS    | 导入关系 |
| CALLS      | 调用关系 |
| IMPLEMENTS | 实现关系 |
| EXTENDS    | 继承关系 |
| USES       | 使用关系 |
| REFERENCES | 引用关系 |

---

## Qdrant

向量数据库，用于语义检索（由 open-node 管理）。

### Collection：code_symbols

**配置**：
- 向量维度：1024（可配置）
- 距离度量：Cosine
- Payload 索引：workspace_id, repo_id, symbol_kind, exported, language

**Payload 结构**：
```json
{
  "workspace_id": "workspace-id",
  "repo_id": "repo-id",
  "symbol_id": "symbol-id",
  "symbol_name": "function-name",
  "symbol_kind": "function",
  "language": "typescript",
  "exported": true,
  "file_path": "/path/to/file.ts"
}
```

---

## ER 关系图

```
workspaces (1)
    ├──< notes (N)
    ├──< imported_files (N)
    ├──< imported_directories (N)
    ├──< web_links (N)
    ├──< git_repositories (N)
    ├──< conversations (N)
    ├──< terminals (N)
    ├──< webviews (N)
    └──< chats (N)
           └──< conversations (N)

imported_directories (1)
    ├──< imported_files (N)
    └──< imported_directories (N)  [自引用]

notes (1)
    └──< notes (N)  [自引用，层级结构]

git_repositories (1)
    ├──< index_jobs (N)
    └──< index_metadata (N)
```

---

## 性能优化

### SQLite 优化

1. **WAL 模式**：启用 WAL 模式支持并发读写
2. **连接池**：使用连接池复用连接
3. **批量操作**：使用事务批量插入
4. **预编译语句**：使用预编译语句提高性能
5. **复合索引**：为常用查询创建复合索引

### 索引策略

```sql
-- 启用 WAL 模式
PRAGMA journal_mode = WAL;

-- 优化设置
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = -64000;  -- 64MB
PRAGMA temp_store = MEMORY;
```

---

## 参考资料

- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [SurrealDB 官方文档](https://surrealdb.com/docs)
- [Qdrant 官方文档](https://qdrant.tech/documentation/)
- [SHARED_STORAGE.md](./SHARED_STORAGE.md)
