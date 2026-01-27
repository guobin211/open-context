# Database Schema 文档

本文档详细说明 Open-Context 项目的数据库架构和表结构。

## 概述

Open-Context 使用多种数据库来存储不同类型的数据：

| 数据库        | 用途                       | 访问模式       | 技术栈                          |
| ------------- | -------------------------- | -------------- | ------------------------------- |
| **app.db**    | 业务核心数据               | 双端读写       | SQLite (better-sqlite3)         |
| **SurrealDB** | 图数据、全文检索、符号存储 | open-node 读写 | SurrealDB (@surrealdb/node)     |
| **Qdrant**    | 向量嵌入、语义检索         | open-node 读写 | Qdrant (@qdrant/js-client-rest) |

## 数据类型分类

### 原子类型（知识库基础单元）

| 类型           | 对应表               | 说明                             |
| -------------- | -------------------- | -------------------------------- |
| `file`         | imported_files       | 导入的文件对象                   |
| `folder`       | imported_directories | 导入的文件夹对象                 |
| `link`         | web_links            | 网页链接                         |
| `note`         | notes                | 笔记对象                         |
| `repo`         | git_repositories     | 代码仓库对象                     |
| `conversation` | conversations        | 会话对象，包含参与者、消息记录等 |

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

## 设计原则

- 原子类型保持独立，便于索引和检索
- 复合类型通过组合原子类型实现复杂场景
- 所有数据结构支持序列化和持久化

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

| 字段           | 类型    | 约束                     | 说明                                 |
| -------------- | ------- | ------------------------ | ------------------------------------ |
| id             | TEXT    | PRIMARY KEY              | 笔记 ID（ULID）                      |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID                      |
| parent_id      | TEXT    | NULL, FK(notes)          | 父笔记 ID（支持层级）                |
| title          | TEXT    | NOT NULL                 | 笔记标题                             |
| note_type      | TEXT    | NOT NULL                 | 笔记类型（markdown/richtext/canvas） |
| content        | TEXT    | NOT NULL DEFAULT ''      | 笔记内容                             |
| summary        | TEXT    | NULL                     | AI 生成摘要                          |
| file_path      | TEXT    | NOT NULL                 | 笔记文件存储路径                     |
| tags           | TEXT    | NULL                     | 标签（JSON 数组）                    |
| word_count     | INTEGER | NOT NULL DEFAULT 0       | 字数统计                             |
| sort_order     | INTEGER | NOT NULL DEFAULT 0       | 同级排序顺序                         |
| is_favorited   | INTEGER | NOT NULL DEFAULT 0       | 是否收藏                             |
| is_pinned      | INTEGER | NOT NULL DEFAULT 0       | 是否置顶                             |
| is_archived    | INTEGER | NOT NULL DEFAULT 0       | 是否归档                             |
| last_viewed_at | INTEGER | NULL                     | 最后查看时间                         |
| created_at     | INTEGER | NOT NULL                 | 创建时间                             |
| updated_at     | INTEGER | NOT NULL                 | 更新时间                             |

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

| 字段                | 类型    | 约束                           | 说明               |
| ------------------- | ------- | ------------------------------ | ------------------ |
| id                  | TEXT    | PRIMARY KEY                    | 文件 ID（ULID）    |
| workspace_id        | TEXT    | NOT NULL, FK(workspaces)       | 所属工作空间 ID    |
| parent_directory_id | TEXT    | NULL, FK(imported_directories) | 父目录 ID          |
| name                | TEXT    | NOT NULL                       | 文件名             |
| original_path       | TEXT    | NOT NULL                       | 原始路径           |
| stored_path         | TEXT    | NOT NULL                       | 存储路径           |
| file_type           | TEXT    | NOT NULL                       | 文件类型（扩展名） |
| size_bytes          | INTEGER | NOT NULL                       | 文件大小（字节）   |
| mime_type           | TEXT    | NULL                           | MIME 类型          |
| checksum            | TEXT    | NULL                           | SHA256 校验和      |
| is_archived         | INTEGER | NOT NULL DEFAULT 0             | 是否归档           |
| created_at          | INTEGER | NOT NULL                       | 创建时间           |
| updated_at          | INTEGER | NOT NULL                       | 更新时间           |

**索引**：

- `idx_files_workspace` - workspace_id
- `idx_files_parent` - parent_directory_id
- `idx_files_workspace_type` - (workspace_id, file_type)
- `idx_files_checksum` - checksum
- `idx_files_workspace_archived` - (workspace_id, is_archived)

---

### 表：imported_directories

导入目录表，原子类型（folder）。

| 字段             | 类型    | 约束                           | 说明            |
| ---------------- | ------- | ------------------------------ | --------------- |
| id               | TEXT    | PRIMARY KEY                    | 目录 ID（ULID） |
| workspace_id     | TEXT    | NOT NULL, FK(workspaces)       | 所属工作空间 ID |
| parent_id        | TEXT    | NULL, FK(imported_directories) | 父目录 ID       |
| name             | TEXT    | NOT NULL                       | 目录名          |
| original_path    | TEXT    | NOT NULL                       | 原始路径        |
| stored_path      | TEXT    | NOT NULL                       | 存储路径        |
| file_count       | INTEGER | NOT NULL DEFAULT 0             | 包含文件数量    |
| total_size_bytes | INTEGER | NOT NULL DEFAULT 0             | 总大小（字节）  |
| is_archived      | INTEGER | NOT NULL DEFAULT 0             | 是否归档        |
| created_at       | INTEGER | NOT NULL                       | 创建时间        |
| updated_at       | INTEGER | NOT NULL                       | 更新时间        |

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

| 字段             | 类型    | 约束                           | 说明              |
| ---------------- | ------- | ------------------------------ | ----------------- |
| id               | TEXT    | PRIMARY KEY                    | 仓库 ID（ULID）   |
| workspace_id     | TEXT    | NOT NULL, FK(workspaces)       | 所属工作空间 ID   |
| name             | TEXT    | NOT NULL                       | 仓库名称          |
| remote_url       | TEXT    | NOT NULL                       | 远程 URL          |
| local_path       | TEXT    | NOT NULL                       | 本地路径          |
| branch           | TEXT    | NOT NULL                       | 当前分支          |
| default_branch   | TEXT    | NULL                           | 默认分支          |
| last_commit_hash | TEXT    | NULL                           | 最后提交哈希      |
| last_synced_at   | INTEGER | NULL                           | 最后同步时间      |
| clone_status     | TEXT    | NOT NULL DEFAULT 'pending'     | 克隆状态          |
| clone_progress   | INTEGER | NOT NULL DEFAULT 0             | 克隆进度（0-100） |
| index_status     | TEXT    | NOT NULL DEFAULT 'not_indexed' | 索引状态          |
| indexed_at       | INTEGER | NULL                           | 索引完成时间      |
| file_count       | INTEGER | NOT NULL DEFAULT 0             | 文件数量          |
| symbol_count     | INTEGER | NOT NULL DEFAULT 0             | 符号数量          |
| vector_count     | INTEGER | NOT NULL DEFAULT 0             | 向量数量          |
| is_archived      | INTEGER | NOT NULL DEFAULT 0             | 是否归档          |
| created_at       | INTEGER | NOT NULL                       | 创建时间          |
| updated_at       | INTEGER | NOT NULL                       | 更新时间          |

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

| 字段           | 类型    | 约束                     | 说明             |
| -------------- | ------- | ------------------------ | ---------------- |
| id             | TEXT    | PRIMARY KEY              | 会话 ID（ULID）  |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID  |
| chat_id        | TEXT    | NULL, FK(chats)          | 所属聊天 ID      |
| title          | TEXT    | NOT NULL                 | 会话标题         |
| model          | TEXT    | NULL                     | 使用的 AI 模型   |
| system_prompt  | TEXT    | NULL                     | 系统提示词       |
| messages       | TEXT    | NOT NULL DEFAULT '[]'    | 消息记录（JSON） |
| message_count  | INTEGER | NOT NULL DEFAULT 0       | 消息数量         |
| token_count    | INTEGER | NOT NULL DEFAULT 0       | Token 使用量     |
| is_favorited   | INTEGER | NOT NULL DEFAULT 0       | 是否收藏         |
| is_archived    | INTEGER | NOT NULL DEFAULT 0       | 是否归档         |
| last_active_at | INTEGER | NULL                     | 最后活跃时间     |
| created_at     | INTEGER | NOT NULL                 | 创建时间         |
| updated_at     | INTEGER | NOT NULL                 | 更新时间         |

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

| 字段            | 类型    | 约束                     | 说明             |
| --------------- | ------- | ------------------------ | ---------------- |
| id              | TEXT    | PRIMARY KEY              | 终端 ID（ULID）  |
| workspace_id    | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID  |
| name            | TEXT    | NOT NULL                 | 终端名称         |
| shell           | TEXT    | NOT NULL                 | Shell 类型       |
| cwd             | TEXT    | NOT NULL                 | 当前工作目录     |
| env             | TEXT    | NULL                     | 环境变量（JSON） |
| history         | TEXT    | NOT NULL DEFAULT '[]'    | 命令历史（JSON） |
| history_count   | INTEGER | NOT NULL DEFAULT 0       | 历史命令数量     |
| is_active       | INTEGER | NOT NULL DEFAULT 0       | 是否活跃         |
| is_archived     | INTEGER | NOT NULL DEFAULT 0       | 是否归档         |
| last_command_at | INTEGER | NULL                     | 最后命令执行时间 |
| created_at      | INTEGER | NOT NULL                 | 创建时间         |
| updated_at      | INTEGER | NOT NULL                 | 更新时间         |

**索引**：

- `idx_terminals_workspace` - workspace_id
- `idx_terminals_workspace_active` - (workspace_id, is_active)

---

### 表：webviews

网页视图表，界面交互类型。

| 字段           | 类型    | 约束                     | 说明             |
| -------------- | ------- | ------------------------ | ---------------- |
| id             | TEXT    | PRIMARY KEY              | 视图 ID（ULID）  |
| workspace_id   | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID  |
| title          | TEXT    | NOT NULL                 | 页面标题         |
| url            | TEXT    | NOT NULL                 | 当前 URL         |
| favicon_url    | TEXT    | NULL                     | 图标 URL         |
| history        | TEXT    | NOT NULL DEFAULT '[]'    | 浏览历史（JSON） |
| is_loading     | INTEGER | NOT NULL DEFAULT 0       | 是否加载中       |
| is_active      | INTEGER | NOT NULL DEFAULT 0       | 是否活跃         |
| is_archived    | INTEGER | NOT NULL DEFAULT 0       | 是否归档         |
| scroll_x       | INTEGER | NOT NULL DEFAULT 0       | 水平滚动位置     |
| scroll_y       | INTEGER | NOT NULL DEFAULT 0       | 垂直滚动位置     |
| zoom_level     | REAL    | NOT NULL DEFAULT 1.0     | 缩放级别         |
| last_active_at | INTEGER | NULL                     | 最后活跃时间     |
| created_at     | INTEGER | NOT NULL                 | 创建时间         |
| updated_at     | INTEGER | NOT NULL                 | 更新时间         |

**索引**：

- `idx_webviews_workspace` - workspace_id
- `idx_webviews_workspace_active` - (workspace_id, is_active)

---

### 表：chats

聊天表，界面交互类型，包含多个会话。

| 字段               | 类型    | 约束                     | 说明            |
| ------------------ | ------- | ------------------------ | --------------- |
| id                 | TEXT    | PRIMARY KEY              | 聊天 ID（ULID） |
| workspace_id       | TEXT    | NOT NULL, FK(workspaces) | 所属工作空间 ID |
| name               | TEXT    | NOT NULL                 | 聊天名称        |
| description        | TEXT    | NULL                     | 描述            |
| default_model      | TEXT    | NULL                     | 默认 AI 模型    |
| default_prompt     | TEXT    | NULL                     | 默认系统提示词  |
| conversation_count | INTEGER | NOT NULL DEFAULT 0       | 会话数量        |
| is_active          | INTEGER | NOT NULL DEFAULT 0       | 是否活跃        |
| is_archived        | INTEGER | NOT NULL DEFAULT 0       | 是否归档        |
| last_active_at     | INTEGER | NULL                     | 最后活跃时间    |
| created_at         | INTEGER | NOT NULL                 | 创建时间        |
| updated_at         | INTEGER | NOT NULL                 | 更新时间        |

**索引**：

- `idx_chats_workspace` - workspace_id
- `idx_chats_workspace_active` - (workspace_id, is_active)
- `idx_chats_workspace_active_time` - (workspace_id, last_active_at DESC)

---

### 表：tasks

异步任务表，用于跟踪后台任务状态。

| 字段           | 类型    | 约束                       | 说明             |
| -------------- | ------- | -------------------------- | ---------------- |
| id             | TEXT    | PRIMARY KEY                | 任务 ID（ULID）  |
| task_type      | TEXT    | NOT NULL                   | 任务类型         |
| status         | TEXT    | NOT NULL DEFAULT 'pending' | 任务状态         |
| progress       | INTEGER | NOT NULL DEFAULT 0         | 进度（0-100）    |
| message        | TEXT    | NULL                       | 状态消息         |
| result         | TEXT    | NULL                       | 任务结果（JSON） |
| error          | TEXT    | NULL                       | 错误信息         |
| retry_count    | INTEGER | NOT NULL DEFAULT 0         | 已重试次数       |
| max_retries    | INTEGER | NOT NULL DEFAULT 3         | 最大重试次数     |
| retry_delay_ms | INTEGER | NOT NULL DEFAULT 1000      | 重试延迟（毫秒） |
| input          | TEXT    | NULL                       | 任务输入（JSON） |
| persistent     | INTEGER | NOT NULL DEFAULT 0         | 是否持久化       |
| created_at     | INTEGER | NOT NULL                   | 创建时间         |
| updated_at     | INTEGER | NOT NULL                   | 更新时间         |
| completed_at   | INTEGER | NULL                       | 完成时间         |

**status 枚举值**：pending、running、completed、failed、cancelled

**索引**：

- `idx_tasks_status` - status
- `idx_tasks_type` - task_type
- `idx_tasks_persistent` - persistent
- `idx_tasks_created_at` - created_at

---

### 表：index_jobs

索引任务表，记录代码索引作业的状态和进度（双端读写）。

| 字段              | 类型    | 约束                           | 说明                         |
| ----------------- | ------- | ------------------------------ | ---------------------------- |
| id                | TEXT    | PRIMARY KEY                    | 任务 ID（ULID）              |
| repo_id           | TEXT    | NOT NULL, FK(git_repositories) | 仓库 ID                      |
| job_type          | TEXT    | NOT NULL                       | 任务类型（full/incremental） |
| status            | TEXT    | NOT NULL DEFAULT 'pending'     | 任务状态                     |
| progress          | INTEGER | NOT NULL DEFAULT 0             | 进度（0-100）                |
| total_files       | INTEGER | NULL                           | 总文件数                     |
| processed_files   | INTEGER | NOT NULL DEFAULT 0             | 已处理文件数                 |
| total_symbols     | INTEGER | NULL                           | 总符号数                     |
| processed_symbols | INTEGER | NOT NULL DEFAULT 0             | 已处理符号数                 |
| error_message     | TEXT    | NULL                           | 错误信息                     |
| metadata          | TEXT    | NULL                           | 元数据（JSON）               |
| started_at        | INTEGER | NULL                           | 开始时间                     |
| completed_at      | INTEGER | NULL                           | 完成时间                     |
| created_at        | INTEGER | NOT NULL                       | 创建时间                     |

**job_type 枚举值**：full、incremental
**status 枚举值**：pending、running、completed、failed、cancelled

**索引**：

- `idx_index_jobs_repo` - repo_id
- `idx_index_jobs_status` - status
- `idx_index_jobs_repo_status` - (repo_id, status)

---

### 表：index_metadata

索引元数据表，记录文件的索引状态和内容哈希（双端读写）。

| 字段            | 类型    | 约束                           | 说明               |
| --------------- | ------- | ------------------------------ | ------------------ |
| id              | TEXT    | PRIMARY KEY                    | 元数据 ID（ULID）  |
| repo_id         | TEXT    | NOT NULL, FK(git_repositories) | 仓库 ID            |
| file_path       | TEXT    | NOT NULL                       | 文件路径           |
| content_hash    | TEXT    | NOT NULL                       | 内容哈希（SHA256） |
| last_indexed_at | INTEGER | NOT NULL                       | 最后索引时间       |
| symbol_count    | INTEGER | NOT NULL DEFAULT 0             | 符号数量           |
| language        | TEXT    | NULL                           | 文件语言           |
| file_size       | INTEGER | NULL                           | 文件大小（字节）   |

**索引**：

- `idx_index_metadata_repo` - repo_id
- `idx_index_metadata_repo_path` - (repo_id, file_path) UNIQUE
- `idx_index_metadata_hash` - content_hash

---

## SurrealDB 数据库

SurrealDB 用于存储符号数据、图关系和全文检索（由 open-node 管理）。

### 连接配置

```typescript
import Surreal from '@surrealdb/node';

const db = new Surreal();

// 嵌入式模式
await db.connect('file://~/.open-context/database/surrealdb/data.db');

// 服务器模式
// await db.connect('http://localhost:8000');

await db.use({ namespace: 'code_index', database: 'open_context' });
```

### 表：symbols

符号数据表，存储所有代码符号的元数据和内容。

符号数据表，存储所有代码符号的元数据和内容。

```sql
DEFINE TABLE symbols SCHEMAFULL;

-- 基础字段
DEFINE FIELD symbol_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD workspace_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD repo_id ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD repo_name ON symbols TYPE string;
DEFINE FIELD file_path ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD language ON symbols TYPE string ASSERT $value != NONE;

-- 符号信息
DEFINE FIELD symbol_name ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD symbol_kind ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD qualified_name ON symbols TYPE string;
DEFINE FIELD visibility ON symbols TYPE string DEFAULT 'public';
DEFINE FIELD exported ON symbols TYPE bool DEFAULT false;

-- 代码内容
DEFINE FIELD code ON symbols TYPE string ASSERT $value != NONE;
DEFINE FIELD signature ON symbols TYPE string;
DEFINE FIELD doc_comment ON symbols TYPE string;

-- 位置信息
DEFINE FIELD start_line ON symbols TYPE number;
DEFINE FIELD end_line ON symbols TYPE number;

-- 元数据
DEFINE FIELD content_hash ON symbols TYPE string;
DEFINE FIELD importance ON symbols TYPE number DEFAULT 0.5;
DEFINE FIELD last_commit ON symbols TYPE string;
DEFINE FIELD indexed_at ON symbols TYPE number;
DEFINE FIELD created_at ON symbols TYPE number DEFAULT time::now();
DEFINE FIELD updated_at ON symbols TYPE number DEFAULT time::now();

-- 索引
DEFINE INDEX symbol_id_idx ON symbols FIELDS symbol_id UNIQUE;
DEFINE INDEX workspace_repo_idx ON symbols FIELDS workspace_id, repo_id;
DEFINE INDEX file_path_idx ON symbols FIELDS repo_id, file_path;
DEFINE INDEX symbol_kind_idx ON symbols FIELDS symbol_kind;

-- 全文搜索索引
DEFINE INDEX symbol_name_search ON symbols FIELDS symbol_name SEARCH ANALYZER simple BM25(1.2, 0.75);
DEFINE INDEX code_search ON symbols FIELDS code SEARCH ANALYZER simple BM25(1.2, 0.75);
```

### 关系表

使用图关系表存储符号之间的依赖关系。

```sql
-- IMPORTS 关系：模块导入
DEFINE TABLE imports SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON imports TYPE number DEFAULT 1.0;
DEFINE FIELD import_type ON imports TYPE string;
DEFINE FIELD created_at ON imports TYPE number DEFAULT time::now();

-- CALLS 关系：函数调用
DEFINE TABLE calls SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON calls TYPE number DEFAULT 1.0;
DEFINE FIELD call_context ON calls TYPE string;
DEFINE FIELD created_at ON calls TYPE number DEFAULT time::now();

-- IMPLEMENTS 关系：接口实现
DEFINE TABLE implements SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON implements TYPE number DEFAULT 1.0;
DEFINE FIELD created_at ON implements TYPE number DEFAULT time::now();

-- EXTENDS 关系：类继承
DEFINE TABLE extends SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON extends TYPE number DEFAULT 1.0;
DEFINE FIELD created_at ON extends TYPE number DEFAULT time::now();

-- USES 关系：类型使用
DEFINE TABLE uses SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON uses TYPE number DEFAULT 1.0;
DEFINE FIELD usage_context ON uses TYPE string;
DEFINE FIELD created_at ON uses TYPE number DEFAULT time::now();

-- REFERENCES 关系：符号引用
DEFINE TABLE references SCHEMAFULL TYPE RELATION IN symbols OUT symbols;
DEFINE FIELD confidence ON references TYPE number DEFAULT 1.0;
DEFINE FIELD reference_type ON references TYPE string;
DEFINE FIELD created_at ON references TYPE number DEFAULT time::now();
```

### 图查询示例

```typescript
// 查找某个符号的所有调用
const calls = await db.query(`
  SELECT ->calls->symbols.* AS called_symbols
  FROM $symbolId
`);

// 查找调用链（2层深度）
const callChain = await db.query(`
  SELECT ->calls->symbols->calls->symbols.*
  FROM $symbolId
`);

// 查找反向依赖
const callers = await db.query(`
  SELECT <-calls<-symbols.* AS caller_symbols
  FROM $symbolId
`);

// 全文搜索
const results = await db.query(
  `
  SELECT *, search::score(1) AS relevance
  FROM symbols
  WHERE symbol_name @1@ $query OR code @1@ $query
  ORDER BY relevance DESC
  LIMIT 20
`,
  { query: 'authentication' }
);

// 联合查询：语义搜索 + 图遍历
const combined = await db.query(`
  LET $matched = (
    SELECT * FROM symbols
    WHERE workspace_id = $workspaceId
      AND symbol_name @1@ $query
    LIMIT 10
  );
  SELECT *, ->calls->symbols.* AS dependencies
  FROM $matched
`);
```

---

## Qdrant 向量数据库

向量数据库，用于代码的语义检索（由 open-node 管理）。

### 连接配置

```typescript
import { QdrantClient } from '@qdrant/js-client-rest';

const client = new QdrantClient({
  url: 'http://localhost:6333'
  // apiKey: 'your-api-key' // 可选
});
```

### Collection：code_symbols

**配置**：

```typescript
await client.createCollection('code_symbols', {
  vectors: {
    size: 1024, // 向量维度，根据embedding模型调整
    distance: 'Cosine'
  }
});
```

**Payload Schema**：

**Payload Schema**：

```typescript
interface SymbolPayload {
  workspace_id: string;
  repo_id: string;
  repo_name: string;
  symbol_id: string;
  symbol_name: string;
  symbol_kind: 'function' | 'class' | 'method' | 'interface' | 'type' | 'variable';
  language: string;
  file_path: string;
  exported: boolean;
  visibility: 'public' | 'private' | 'protected';
  code: string;
  signature?: string;
  importance: number;
  last_commit: string;
  indexed_at: number;
}
```

**创建索引**：

```typescript
// 为常用过滤字段创建索引
await client.createPayloadIndex('code_symbols', {
  field_name: 'workspace_id',
  field_schema: 'keyword'
});

await client.createPayloadIndex('code_symbols', {
  field_name: 'repo_id',
  field_schema: 'keyword'
});

await client.createPayloadIndex('code_symbols', {
  field_name: 'symbol_kind',
  field_schema: 'keyword'
});

await client.createPayloadIndex('code_symbols', {
  field_name: 'language',
  field_schema: 'keyword'
});

await client.createPayloadIndex('code_symbols', {
  field_name: 'exported',
  field_schema: 'bool'
});
```

**查询示例**：

```typescript
// 基础语义查询
const results = await client.search('code_symbols', {
  vector: queryEmbedding, // [1024]维向量
  limit: 10,
  filter: {
    must: [{ key: 'workspace_id', match: { value: workspaceId } }]
  },
  with_payload: true
});

// 限定仓库和符号类型
const results = await client.search('code_symbols', {
  vector: queryEmbedding,
  limit: 20,
  filter: {
    must: [
      { key: 'workspace_id', match: { value: workspaceId } },
      { key: 'repo_id', match: { any: [repoId1, repoId2] } },
      { key: 'symbol_kind', match: { any: ['function', 'method'] } }
    ]
  }
});

// 仅查询公开符号
const results = await client.search('code_symbols', {
  vector: queryEmbedding,
  limit: 10,
  filter: {
    must: [
      { key: 'workspace_id', match: { value: workspaceId } },
      { key: 'exported', match: { value: true } }
    ]
  }
});
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
