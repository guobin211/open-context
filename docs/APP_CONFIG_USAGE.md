# App Config 与持久化存储规范

本文档定义了 Open-Context 项目的应用配置管理和持久化存储路径规范，确保所有模块使用统一的存储结构。

## 存储根目录

所有持久化数据统一存储在用户主目录下的 `~/.open-context/` 目录：

- **环境变量**：`OPEN_CONTEXT_HOME`（可选，默认为 `~/.open-context`）
- **默认路径**：`~/.open-context/`
- **路径解析**：
  - TypeScript: 使用 Tauri 的 `path.homeDir()`
  - Node.js: 使用 `os.homedir()`
  - Rust: 使用 `dirs::home_dir()`

## 目录结构

```
~/.open-context/
├── cache/          # 缓存目录（Tauri Store 持久化文件）
├── config/         # 配置文件（config.json）
├── database/       # 数据库数据
│   ├── app_state.db    # SQLite 数据库
│   ├── leveldb/        # LevelDB 数据库
│   │   ├── main/           # 主数据库（符号、元数据）
│   │   ├── edges/          # 正向边（依赖关系）
│   │   └── reverse-edges/  # 反向边（被依赖关系）
│   └── qdrant/         # Qdrant 向量数据库
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

| 子目录       | 用途          | 路径示例                     | 文件类型                     |
| ------------ | ------------- | ---------------------------- |--------------------------|
| `cache/`     | 临时缓存数据  | `~/.open-context/cache/`     | `.cache`, `.store.json`  |
| `config/`    | 应用配置      | `~/.open-context/config/`    | `config.json`            |
| `database/`  | 数据库文件    | `~/.open-context/database/`  | `.db`, LevelDB/Qdrant 数据 |
| `notebook/`  | 笔记数据      | `~/.open-context/notebook/`  | `.json`, `.md`           |
| `session/`   | 会话数据      | `~/.open-context/session/`   | `.json`                  |
| `workspace/` | 工作空间数据  | `~/.open-context/workspace/` | `.json`                  |
| `files/`     | 文件索引数据  | `~/.open-context/files/`     | `.json`, `.db`           |
| `logs/`      | 应用日志      | `~/.open-context/logs/`      | `.log`                   |
| `plugins/`   | 插件配置      | `~/.open-context/plugins/`   | `.json`, `.md`           |
| `commands/`  | 命令历史/配置 | `~/.open-context/commands/`  | `.json`                  |
| `skills/`    | Skills 数据   | `~/.open-context/skills/`    | `.json`, `.md`           |
| `todos/`     | Todo 数据     | `~/.open-context/todos/`     | `.json`                  |
| `projects/`  | 项目数据      | `~/.open-context/projects/`  | `.json`                  |
| `rules/`     | 规则数据      | `~/.open-context/rules/`     | `.json`, `.md`           |
| `hooks/`     | Hooks 配置    | `~/.open-context/hooks/`     | `.json`                  |

## 应用配置（config.json）

### 配置文件位置

`~/.open-context/config/config.json`

### 配置文件结构

```json
{
  "version": "0.1.0",
  "node_server": {
    "port": 4500,
    "auto_start": true
  },
  "qdrant": {
    "url": "http://localhost:6333",
    "embedding_dim": 1024
  },
  "log_level": "info",
  "workspaces_dir": "/Users/username/.open-context/workspace"
}
```

### 配置项说明

| 配置项                     | 类型     | 默认值                              | 说明                       |
| -------------------------- | -------- | ----------------------------------- | -------------------------- |
| `version`                  | String   | 自动从 `Cargo.toml` 读取            | 应用版本号                 |
| `node_server.port`         | u16      | `4500`                              | Node.js 后端服务器监听端口 |
| `node_server.auto_start`   | bool     | `true`                              | 是否自动启动 Node.js 服务  |
| `qdrant.url`               | String   | `"http://localhost:6333"`           | Qdrant 向量数据库连接地址  |
| `qdrant.embedding_dim`     | usize    | `1024`                              | 向量嵌入维度               |
| `log_level`                | String   | `"info"`                            | 日志级别                   |
| `workspaces_dir`           | PathBuf  | `~/.open-context/workspace`         | 工作空间数据存储目录       |

**log_level 可选值**：`"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`

## 配置管理功能

`app_config` 模块提供以下功能：

1. **读取配置**：从 `config/config.json` 文件加载配置
2. **修改配置**：更新配置项并自动保存
3. **修改配置目录**：更改配置文件存储位置
4. **线程安全**：使用 `ConfigManager` 提供并发安全的配置访问
5. **初始化目录**：自动创建应用所需的目录结构

## Rust 使用示例

### 1. 基本用法：加载和保存配置

```rust
use open_context_lib::app_config::AppConfig;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = AppConfig::load()?;

    println!("Node server port: {}", config.node_server.port);
    println!("Qdrant URL: {}", config.qdrant.url);

    config.node_server.port = 5000;
    config.save()?;

    Ok(())
}
```

### 2. 使用便捷方法修改配置

```rust
use open_context_lib::app_config::AppConfig;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = AppConfig::load()?;

    config.set_node_server_port(5000)?;
    config.set_node_server_auto_start(false)?;
    config.set_qdrant_url("http://192.168.1.100:6333".to_string())?;
    config.set_qdrant_embedding_dim(768)?;
    config.set_log_level("debug".to_string())?;
    config.set_workspaces_dir("/custom/path/workspaces".into())?;

    Ok(())
}
```

### 3. 使用 ConfigManager（推荐用于多线程环境）

```rust
use open_context_lib::app_config::ConfigManager;
use std::sync::Arc;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let manager = Arc::new(ConfigManager::new()?);

    let config = manager.get();
    println!("Current port: {}", config.node_server.port);

    manager.update(|cfg| {
        cfg.node_server.port = 6000;
        cfg.log_level = "debug".to_string();
        Ok(())
    })?;

    let manager_clone = Arc::clone(&manager);
    std::thread::spawn(move || {
        let config = manager_clone.get();
        println!("Port in thread: {}", config.node_server.port);
    });

    manager.reload()?;

    Ok(())
}
```

### 4. 在 Tauri 应用中使用

```rust
use open_context_lib::app_config::ConfigManager;
use tauri::Manager;
use std::sync::Arc;

pub struct AppConfigState(pub Arc<ConfigManager>);

#[tauri::command]
fn get_config(state: tauri::State<AppConfigState>) -> Result<String, String> {
    let config = state.0.get();
    serde_json::to_string_pretty(&config).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_node_port(state: tauri::State<AppConfigState>, port: u16) -> Result<(), String> {
    state.0.update(|cfg| {
        cfg.node_server.port = port;
        Ok(())
    }).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            open_context_lib::app_config::init_app_dirs()
                .map_err(|e| format!("Failed to init app dirs: {}", e))?;

            let config_manager = ConfigManager::new()
                .map_err(|e| format!("Failed to load config: {}", e))?;

            app.manage(AppConfigState(Arc::new(config_manager)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_config, update_node_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5. 初始化应用目录结构

```rust
use open_context_lib::app_config::init_app_dirs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    init_app_dirs()?;
    println!("Application directories initialized successfully!");
    Ok(())
}
```

## 路径拼接规范

### TypeScript (前端)

```typescript
import { homeDir } from '@tauri-apps/api/path';
import { join } from '@tauri-apps/api/path';

const getStorePath = async (subdir: string, filename: string): Promise<string> => {
  const home = await homeDir();
  return join(home, '.open-context', subdir, filename);
};

const chatStorePath = await getStorePath('cache', 'chat-store.store.json');
// 结果: ~/.open-context/cache/chat-store.store.json
```

### Node.js (后端)

```typescript
import { homedir } from 'os';
import { join } from 'path';

const getStorePath = (subdir: string, filename: string): string => {
  return join(homedir(), '.open-context', subdir, filename);
};

const chatStorePath = getStorePath('cache', 'chat-store.store.json');
// 结果: ~/.open-context/cache/chat-store.store.json
```

### Rust (桌面端)

```rust
use std::path::PathBuf;
use dirs::home_dir;

fn get_store_path(subdir: &str, filename: &str) -> PathBuf {
    let home = home_dir().expect("Cannot determine home directory");
    home.join(".open-context").join(subdir).join(filename)
}

fn main() {
    let chat_store_path = get_store_path("cache", "chat-store.store.json");
    // 结果: ~/.open-context/cache/chat-store.store.json
}
```

## 前端 TypeScript 集成

```typescript
import { invoke } from '@tauri-apps/api/core';

interface AppConfig {
  version: string;
  node_server: {
    port: number;
    auto_start: boolean;
  };
  qdrant: {
    url: string;
    embedding_dim: number;
  };
  log_level: string;
  workspaces_dir: string;
}

async function getConfig(): Promise<AppConfig> {
  const configJson = await invoke<string>('get_config');
  return JSON.parse(configJson);
}

async function updateNodePort(port: number): Promise<void> {
  await invoke('update_node_port', { port });
}

async function main() {
  const config = await getConfig();
  console.log('Current config:', config);

  await updateNodePort(5000);
  console.log('Port updated to 5000');
}
```

## 模块存储映射

### Tauri Store 文件

| 模块                | Store 文件                 | 路径                                             | 状态      |
| ------------------- | -------------------------- | ------------------------------------------------ | --------- |
| Chat Store          | `chat-store.store.json`    | `~/.open-context/cache/chat-store.store.json`    | ✅ 已配置 |
| Right Sidebar Store | `right-sidebar.store.json` | `~/.open-context/cache/right-sidebar.store.json` | ✅ 已配置 |
| Notebook Store      | `notebook-store.store.json`| `~/.open-context/cache/notebook-store.store.json`| ⏳ 待迁移 |
| Files Store         | `files-store.store.json`   | `~/.open-context/cache/files-store.store.json`   | ⏳ 待迁移 |
| Workspace Store     | `workspace-store.store.json`| `~/.open-context/cache/workspace-store.store.json`| ⏳ 待迁移 |
| Tabs Store          | `tabs-store.store.json`    | `~/.open-context/cache/tabs-store.store.json`    | ⏳ 待迁移 |
| Sidebar Store       | `sidebar-store.store.json` | `~/.open-context/cache/sidebar-store.store.json` | ⏳ 待迁移 |

### 文件命名规范

- **Tauri Store 文件**：使用 `.store.json` 后缀，存储在 `cache/` 目录
- **配置文件**：使用 `.json` 后缀，存储在 `config/` 目录
- **日志文件**：使用 `.log` 后缀，存储在 `logs/` 目录
- **笔记文件**：使用 `.md` 或 `.json` 后缀，存储在 `notebook/` 目录

## 迁移指南

### 迁移现有 Store 文件

如果需要将现有 Zustand Store 的持久化路径迁移到新规范：

1. **确定目标路径**：所有 Tauri Store 文件统一存储到 `~/.open-context/cache/` 目录
2. **修改 Store 配置**：更新 `Store.load()` 调用中的路径
3. **验证数据迁移**：确保旧数据可以正确迁移到新路径

**示例**：迁移 `notebook-store.ts`

```typescript
// 修改前
const store = await Store.load('notebook-store.json');

// 修改后
import { homeDir, join } from '@tauri-apps/api/path';

const home = await homeDir();
const storePath = await join(home, '.open-context', 'cache', 'notebook-store.store.json');
const store = await Store.load(storePath);
```

### 自动迁移脚本

如果需要保留旧数据，可以在应用启动时添加迁移逻辑：

```typescript
import { exists, readFile, writeFile, mkdir } from '@tauri-apps/plugin-fs';

async function migrateStore(oldPath: string, newPath: string): Promise<void> {
  if (await exists(newPath)) return;

  const oldExists = await exists(oldPath);
  if (!oldExists) return;

  const content = await readFile(oldPath);

  const dir = newPath.split('/').slice(0, -1).join('/');
  await mkdir(dir, { recursive: true });

  await writeFile(newPath, content);
}
```

## 配置验证

在应用启动时，验证存储路径配置是否正确：

```typescript
import { exists, mkdir } from '@tauri-apps/plugin-fs';
import { homeDir, join } from '@tauri-apps/api/path';

async function validateStoragePaths(): Promise<void> {
  const home = await homeDir();
  const baseDir = await join(home, '.open-context');

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
}
```

## 最佳实践

### 1. 路径拼接

- ✅ **推荐**：使用 `join()` 或 `path.join()` 拼接路径，自动处理不同操作系统的路径分隔符
- ❌ **不推荐**：使用字符串拼接（`'~/.open-context/' + filename`）

### 2. 目录创建

- 在写入文件前，确保目标目录存在
- 使用 `{ recursive: true }` 选项自动创建父目录

```typescript
import { mkdir, writeTextFile } from '@tauri-apps/plugin-fs';

async function ensureWriteFile(path: string, content: string): Promise<void> {
  const dir = path.split('/').slice(0, -1).join('/');
  await mkdir(dir, { recursive: true });
  await writeTextFile(path, content);
}
```

### 3. 错误处理

- 所有文件操作都应该有错误处理
- 使用 `try-catch` 捕获并记录错误

```typescript
try {
  const data = await readFile(path);
} catch (error) {
  console.error(`Failed to read file: ${path}`, error);
}
```

### 4. 配置管理

- **应用启动时初始化**：在 `main()` 或 `setup()` 中调用 `init_app_dirs()`
- **使用 ConfigManager**：多线程环境中使用 `ConfigManager` 而不是直接使用 `AppConfig`
- **避免频繁保存**：批量修改配置项后再调用 `save()`，减少磁盘 I/O
- **验证配置值**：修改端口号、URL 等值时，先验证有效性
- **配置备份**：重要配置变更前，备份 `config/config.json` 文件
- **环境变量优先**：使用 `OPEN_CONTEXT_HOME` 环境变量支持便携式部署

## 错误处理

所有配置操作都返回 `Result<T, Box<dyn std::error::Error>>`，常见错误：

- **文件 I/O 错误**：无法读写配置文件（权限不足、磁盘满）
- **JSON 解析错误**：配置文件格式错误
- **路径错误**：配置目录路径无效

```rust
use open_context_lib::app_config::AppConfig;

fn handle_config_error() {
    match AppConfig::load() {
        Ok(config) => {
            println!("Config loaded successfully");
        }
        Err(e) => {
            eprintln!("Failed to load config: {}", e);
            let default_config = AppConfig::default();
        }
    }
}
```

## 测试

运行配置模块测试：

```bash
cargo test --lib app_config
```

测试覆盖：

- ✅ 默认配置创建
- ✅ 配置序列化/反序列化
- ✅ ConfigManager 线程安全更新
- ✅ 自定义配置目录

## 参考资源

- [Tauri File System API](https://v2.tauri.app/plugin/file-system/)
- [Tauri Path API](https://v2.tauri.app/api/path/)
- [Node.js path 模块](https://nodejs.org/api/path.html)
- [Node.js os 模块](https://nodejs.org/api/os.html)
- [Rust std::path](https://doc.rust-lang.org/std/path/index.html)

## 版本历史

| 版本  | 日期       | 变更说明                                                     |
| ----- | ---------- | ------------------------------------------------------------ |
| 2.0.0 | 2026-01-22 | 合并配置管理和存储规范，统一存储路径到 `~/.open-context/`   |
| 1.1.0 | 2026-01-22 | 移除 tauri 目录，Tauri Store 文件迁移到 cache 目录           |
| 1.0.0 | 2026-01-22 | 初始版本                                                     |
