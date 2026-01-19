# App Config 使用示例

本文档展示如何使用 `app_config.rs` 模块管理应用配置。

## 功能概述

`app_config` 模块提供以下功能：

1. **读取配置**：从 `config.json` 文件加载配置
2. **修改配置**：更新配置项并自动保存
3. **修改配置目录**：更改配置文件存储位置
4. **线程安全**：使用 `ConfigManager` 提供并发安全的配置访问
5. **初始化目录**：自动创建应用所需的目录结构

## 配置文件结构

默认配置文件位置：`~/.config/open-context/config.json`

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
  "workspaces_dir": "/Users/username/.config/open-context/workspaces"
}
```

## 使用示例

### 1. 基本用法：加载和保存配置

```rust
use open_context_lib::app_config::AppConfig;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 加载配置（如果文件不存在，会创建默认配置）
    let mut config = AppConfig::load()?;

    println!("Node server port: {}", config.node_server.port);
    println!("Qdrant URL: {}", config.qdrant.url);
    println!("Log level: {}", config.log_level);

    // 修改配置并保存
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

    // 修改 Node.js 服务器端口（自动保存）
    config.set_node_server_port(5000)?;

    // 修改自动启动设置
    config.set_node_server_auto_start(false)?;

    // 修改 Qdrant URL
    config.set_qdrant_url("http://192.168.1.100:6333".to_string())?;

    // 修改嵌入向量维度
    config.set_qdrant_embedding_dim(768)?;

    // 修改日志级别
    config.set_log_level("debug".to_string())?;

    // 修改工作空间目录
    config.set_workspaces_dir("/custom/path/workspaces".into())?;

    Ok(())
}
```

### 3. 使用 ConfigManager（推荐用于多线程环境）

```rust
use open_context_lib::app_config::ConfigManager;
use std::sync::Arc;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建配置管理器
    let manager = Arc::new(ConfigManager::new()?);

    // 读取配置（获取只读副本）
    let config = manager.get();
    println!("Current port: {}", config.node_server.port);

    // 更新配置（线程安全）
    manager.update(|cfg| {
        cfg.node_server.port = 6000;
        cfg.log_level = "debug".to_string();
        Ok(())
    })?;

    // 在多线程环境中使用
    let manager_clone = Arc::clone(&manager);
    std::thread::spawn(move || {
        let config = manager_clone.get();
        println!("Port in thread: {}", config.node_server.port);
    });

    // 重新加载配置文件（如果文件被外部修改）
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
            // 初始化应用目录
            open_context_lib::app_config::init_app_dirs()
                .map_err(|e| format!("Failed to init app dirs: {}", e))?;

            // 创建配置管理器
            let config_manager = ConfigManager::new()
                .map_err(|e| format!("Failed to load config: {}", e))?;

            // 将配置管理器添加到应用状态
            app.manage(AppConfigState(Arc::new(config_manager)));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_config, update_node_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 5. 修改配置目录

```rust
use open_context_lib::app_config::AppConfig;
use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 方法 1：通过环境变量（推荐）
    std::env::set_var("OPEN_CONTEXT_CONFIG_DIR", "/custom/config/path");
    let config = AppConfig::load()?;

    // 方法 2：运行时更改配置目录
    let new_config = AppConfig::change_config_dir(PathBuf::from("/new/config/path"))?;
    println!("Config loaded from new directory: {:?}", new_config);

    // 使用 ConfigManager 更改配置目录
    let manager = ConfigManager::new()?;
    manager.change_config_dir(PathBuf::from("/another/path"))?;

    Ok(())
}
```

### 6. 初始化应用目录结构

```rust
use open_context_lib::app_config::init_app_dirs;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建所有必需的目录结构
    init_app_dirs()?;

    // 这会创建以下目录：
    // ~/.config/open-context/
    // ├── config.json
    // ├── leveldb/
    // │   ├── main/
    // │   ├── edges/
    // │   └── reverse-edges/
    // ├── logs/
    // └── workspaces/

    println!("Application directories initialized successfully!");
    Ok(())
}
```

## 前端 TypeScript 集成示例

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

// 获取配置
async function getConfig(): Promise<AppConfig> {
  const configJson = await invoke<string>('get_config');
  return JSON.parse(configJson);
}

// 更新 Node 服务器端口
async function updateNodePort(port: number): Promise<void> {
  await invoke('update_node_port', { port });
}

// 使用示例
async function main() {
  const config = await getConfig();
  console.log('Current config:', config);

  await updateNodePort(5000);
  console.log('Port updated to 5000');
}
```

## 配置项说明

### version

- 类型：`String`
- 说明：应用版本号，自动从 `Cargo.toml` 读取

### node_server.port

- 类型：`u16`
- 默认值：`4500`
- 说明：Node.js 后端服务器监听端口

### node_server.auto_start

- 类型：`bool`
- 默认值：`true`
- 说明：是否在应用启动时自动启动 Node.js 服务器

### qdrant.url

- 类型：`String`
- 默认值：`"http://localhost:6333"`
- 说明：Qdrant 向量数据库连接地址

### qdrant.embedding_dim

- 类型：`usize`
- 默认值：`1024`
- 说明：向量嵌入维度

### log_level

- 类型：`String`
- 默认值：`"info"`
- 可选值：`"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`
- 说明：日志输出级别

### workspaces_dir

- 类型：`PathBuf`
- 默认值：`~/.config/open-context/workspaces`
- 说明：工作空间数据存储目录

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
            // 可以选择使用默认配置继续运行
            let default_config = AppConfig::default();
        }
    }
}
```

## 最佳实践

1. **应用启动时初始化**：在 `main()` 或 `setup()` 中调用 `init_app_dirs()`
2. **使用 ConfigManager**：多线程环境中使用 `ConfigManager` 而不是直接使用 `AppConfig`
3. **避免频繁保存**：批量修改配置项后再调用 `save()`，减少磁盘 I/O
4. **验证配置值**：修改端口号、URL 等值时，先验证有效性
5. **配置备份**：重要配置变更前，备份 `config.json` 文件
6. **环境变量优先**：使用 `OPEN_CONTEXT_CONFIG_DIR` 环境变量支持便携式部署

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
