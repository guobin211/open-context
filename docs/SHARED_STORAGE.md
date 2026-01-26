# 共享存储规范

本文档定义 Open-Context 项目的统一存储路径规范，适用于 Tauri、Node.js 和 Web 三端。

## 存储根目录

所有持久化数据统一存储在用户主目录下：

- **默认路径**：`~/.open-context/`
- **环境变量**：`OPEN_CONTEXT_HOME`（可选覆盖）

### 路径解析方式

| 平台              | 方法                             |
| ----------------- | -------------------------------- |
| Rust (Tauri)      | `dirs::home_dir()`               |
| Node.js           | `os.homedir()`                   |
| TypeScript (前端) | `@tauri-apps/api/path.homeDir()` |

## 目录结构

```
~/.open-context/
├── bin/            # 二进制文件（sidecar 模式）
├── cache/          # 缓存数据（Tauri Store 持久化文件）
├── config/         # 配置文件（config.json）
├── database/       # 数据库数据
│   ├── sqlite/             # SQLite 数据库目录
│   │   ├── workspace.db    # 工作空间、笔记、文件、链接
│   │   ├── repository.db   # Git 仓库、索引任务
│   │   ├── symbol.db       # 符号数据（KV 存储）
│   │   ├── edge.db         # 正向边（依赖关系图）
│   │   └── reverse_edge.db # 反向边（被依赖关系）
│   ├── surrealdb/          # SurrealDB 数据库（图数据、全文检索）
│   └── qdrant/             # Qdrant 向量数据库（语义检索）
├── notebook/       # 笔记数据
├── session/        # 会话数据
├── workspace/      # 工作空间数据
├── files/          # 文件索引数据
├── logs/           # 应用日志
├── plugins/        # 插件配置
├── commands/       # 命令历史/配置
├── skills/         # Skills 数据
├── todos/          # Todo 数据
├── projects/       # 项目数据
├── rules/          # 规则数据
└── hooks/          # Hooks 配置
```

## 子目录规范

| 子目录       | 用途          | 文件类型                             |
| ------------ | ------------- | ------------------------------------ |
| `cache/`     | 临时缓存数据  | `.cache`, `.store.json`              |
| `config/`    | 应用配置      | `config.json`                        |
| `database/`  | 数据库文件    | `.db`, LevelDB/Qdrant/SurrealDB 数据 |
| `notebook/`  | 笔记数据      | `.json`, `.md`                       |
| `session/`   | 会话数据      | `.json`                              |
| `workspace/` | 工作空间数据  | `.json`                              |
| `files/`     | 文件索引数据  | `.json`, `.db`                       |
| `logs/`      | 应用日志      | `.log`                               |
| `plugins/`   | 插件配置      | `.json`, `.md`                       |
| `commands/`  | 命令历史/配置 | `.json`                              |
| `skills/`    | Skills 数据   | `.json`, `.md`                       |
| `todos/`     | Todo 数据     | `.json`                              |
| `projects/`  | 项目数据      | `.json`                              |
| `rules/`     | 规则数据      | `.json`, `.md`                       |
| `hooks/`     | Hooks 配置    | `.json`                              |

## 应用配置

### 配置文件位置

`~/.open-context/config/config.json`

### 配置文件结构

```json
{
  "version": "0.1.0",
  "database": {
    "sqlite": {
      "path": "~/.open-context/database/sqlite",
      "wal_mode": true,
      "busy_timeout": 5000,
      "cache_size_mb": 64,
      "mmap_size_gb": 30
    },
    "surrealdb": {
      "url": "http://localhost:8000",
      "namespace": "code_index",
      "database": "open_context",
      "username": "root",
      "password": "root",
      "embedded": false,
      "data_path": "~/.open-context/database/surrealdb"
    },
    "qdrant": {
      "url": "http://localhost:6333",
      "api_key": null,
      "embedding_dim": 1024,
      "collection_name": "code_symbols",
      "distance_metric": "Cosine",
      "embedded": false,
      "data_path": "~/.open-context/database/qdrant"
    }
  },
  "node_server": {
    "port": 4500,
    "auto_start": true,
    "health_check_interval_ms": 30000
  },
  "indexer": {
    "batch_size": 100,
    "max_file_size_mb": 10,
    "skip_patterns": ["node_modules", ".git", "dist", "build"]
  },
  "log_level": "info"
}
```

### 配置项说明

| 配置项                                 | 类型   | 默认值                            | 说明                 |
| -------------------------------------- | ------ | --------------------------------- | -------------------- |
| `version`                              | String | 自动读取                          | 应用版本号           |
| `database.sqlite.path`                 | String | `~/.open-context/database/sqlite` | SQLite 路径          |
| `database.sqlite.wal_mode`             | bool   | `true`                            | WAL 模式             |
| `database.sqlite.busy_timeout`         | number | `5000`                            | SQLite 忙等待超时    |
| `database.surrealdb.url`               | String | `http://localhost:8000`           | SurrealDB 连接地址   |
| `database.surrealdb.namespace`         | String | `code_index`                      | SurrealDB 命名司     |
| `database.surrealdb.database`          | String | `open_context`                    | SurrealDB 数据库名   |
| `database.qdrant.url`                  | String | `http://localhost:6333`           | Qdrant 连接地址      |
| `database.qdrant.embedding_dim`        | number | `1024`                            | 向量维度             |
| `node_server.port`                     | u16    | `4500`                            | Node.js 服务端口     |
| `node_server.auto_start`               | bool   | `true`                            | 是否自动启动服务     |
| `node_server.health_check_interval_ms` | number | `30000`                           | 健康检查间隔（毫秒） |
| `indexer.batch_size`                   | number | `100`                             | 索引批次大小         |
| `indexer.max_file_size_mb`             | number | `10`                              | 最大文件大小（MB）   |
| `log_level`                            | String | `info`                            | 日志级别             |

**log_level 可选值**：`trace`, `debug`, `info`, `warn`, `error`

## 路径拼接规范

### TypeScript (前端)

```typescript
import { homeDir, join } from '@tauri-apps/api/path';

const getStorePath = async (subdir: string, filename: string): Promise<string> => {
  const home = await homeDir();
  return join(home, '.open-context', subdir, filename);
};
```

### Node.js (后端)

```typescript
import { homedir } from 'os';
import { join } from 'path';

const getStorePath = (subdir: string, filename: string): string => {
  return join(homedir(), '.open-context', subdir, filename);
};
```

### Rust (Tauri)

```rust
use std::path::PathBuf;
use dirs::home_dir;

fn get_store_path(subdir: &str, filename: &str) -> PathBuf {
    let home = home_dir().expect("Cannot determine home directory");
    home.join(".open-context").join(subdir).join(filename)
}
```

## 模块存储映射

### Tauri Store 文件

| 模块            | Store 文件                   | 路径                                               |
| --------------- | ---------------------------- | -------------------------------------------------- |
| Chat Store      | `chat-store.store.json`      | `~/.open-context/cache/chat-store.store.json`      |
| Right Sidebar   | `right-sidebar.store.json`   | `~/.open-context/cache/right-sidebar.store.json`   |
| Notebook Store  | `notebook-store.store.json`  | `~/.open-context/cache/notebook-store.store.json`  |
| Workspace Store | `workspace-store.store.json` | `~/.open-context/cache/workspace-store.store.json` |

### 文件命名规范

- **Tauri Store 文件**：`.store.json` 后缀，存储在 `cache/`
- **配置文件**：`.json` 后缀，存储在 `config/`
- **日志文件**：`.log` 后缀，存储在 `logs/`
- **笔记文件**：`.md` 或 `.json` 后缀，存储在 `notebook/`

## 目录初始化

应用启动时自动创建所需目录：

```typescript
const requiredDirs = [
  'cache',
  'config',
  'database',
  'notebook',
  'session',
  'workspace',
  'files',
  'logs',
  'plugins',
  'commands',
  'skills',
  'todos',
  'projects',
  'rules',
  'hooks'
];

for (const dir of requiredDirs) {
  const dirPath = await join(baseDir, dir);
  if (!(await exists(dirPath))) {
    await mkdir(dirPath, { recursive: true });
  }
}
```

## 最佳实践

1. **路径拼接**：使用 `join()` 而非字符串拼接
2. **目录创建**：写入前确保目录存在，使用 `{ recursive: true }`
3. **错误处理**：所有文件操作使用 `try-catch`
4. **环境变量**：支持 `OPEN_CONTEXT_HOME` 便携式部署
