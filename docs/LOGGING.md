# Open-App 日志系统

## 概述

Open-App 使用 `tauri-plugin-log` 实现日志功能，提供灵活的日志级别和输出目标配置。

## 架构

### 核心组件

- **tauri-plugin-log**: Tauri 官方日志插件，提供跨平台日志功能
- **LogConfig**: 日志配置管理（位于 `src/logging/log_config.rs`）
- **FileRotator**: 日志文件轮转和清理（位于 `src/logging/file_rotator.rs`）

### 初始化流程

1. 在 `app_plugins.rs` 的 `setup_general_plugins` 函数中初始化日志插件
2. 通过 `LogConfig::from_env("open-app")` 读取环境变量配置
3. 根据配置构建 `tauri_plugin_log::Builder`
4. 设置日志级别和输出目标（控制台/文件/Webview）

## 环境变量配置

### LOG_LEVEL

日志级别，可选值：

- `trace`: 最详细的日志
- `debug`: 调试信息（开发环境默认）
- `info`: 一般信息（生产环境默认）
- `warn`: 警告信息
- `error`: 错误信息

**示例**:

```bash
export LOG_LEVEL=debug
```

### LOG_TARGET

日志输出目标，可选值：

- `console`: 仅输出到控制台和 Webview
- `file`: 仅输出到文件
- `both`: 同时输出到控制台、Webview 和文件（开发环境默认）

**示例**:

```bash
export LOG_TARGET=both
```

### LOG_DIR

日志文件存储目录，默认：`~/.open-context/logs/`

**示例**:

```bash
export LOG_DIR=/path/to/logs
```

### LOG_RETENTION_DAYS

日志保留天数，默认：7 天

**示例**:

```bash
export LOG_RETENTION_DAYS=30
```

## 日志文件

### 文件命名

日志文件按应用名称命名：

```
open-app.log
```

### 存储位置

默认存储在：`~/.open-context/logs/`

使用 `tauri-plugin-log` 的 `TargetKind::LogDir`，日志会自动存储到 Tauri 应用的标准日志目录。

## 使用示例

### 在代码中记录日志

```rust
use log::{trace, debug, info, warn, error};

// Trace 级别
trace!("详细的跟踪信息");

// Debug 级别
debug!("调试信息: {}", some_value);

// Info 级别
info!("应用启动成功");

// Warn 级别
warn!("配置项缺失，使用默认值");

// Error 级别
error!("操作失败: {}", error_message);
```

### 结构化日志

```rust
// 使用格式化宏
info!("用户 {} 登录成功", username);

// 调试对象
debug!("配置对象: {:?}", config);
```

## 日志输出示例

### 控制台输出

```
2024-01-27 17:00:00 [INFO] Logger initialized with level: Debug, target: Both
2024-01-27 17:00:01 [INFO] plugins initialized
2024-01-27 17:00:02 [DEBUG] Workspace service created
```

### Webview 输出

日志会同时输出到前端的浏览器控制台，方便调试。

## 最佳实践

### 1. 选择合适的日志级别

- **trace**: 非常详细的跟踪信息，通常只在调试特定问题时使用
- **debug**: 调试信息，开发时使用
- **info**: 重要的业务事件（启动、关闭、关键操作）
- **warn**: 潜在问题，但不影响功能
- **error**: 错误事件，需要关注

### 2. 避免敏感信息

不要在日志中输出：

- 密码、Token、API 密钥
- 个人隐私信息
- 完整的文件路径（使用相对路径）

```rust
// ❌ 错误示例
error!("登录失败，密码: {}", password);

// ✅ 正确示例
error!("登录失败，用户名: {}", username);
```

### 3. 使用结构化日志

```rust
// ❌ 不推荐
info!("User John logged in from 192.168.1.1");

// ✅ 推荐
info!("用户登录 - 用户名: {}, IP: {}", username, ip);
```

### 4. 日志清理

日志文件会根据 `LOG_RETENTION_DAYS` 自动清理。默认保留 7 天。

## 配置示例

### 开发环境

```bash
# .env.development
LOG_LEVEL=debug
LOG_TARGET=both
```

### 生产环境

```bash
# .env.production
LOG_LEVEL=info
LOG_TARGET=file
LOG_RETENTION_DAYS=30
```

## 故障排查

### 日志未输出

1. 检查 `LOG_LEVEL` 设置是否正确
2. 确认 `LOG_TARGET` 配置
3. 检查日志目录权限

### 日志文件过大

1. 调整 `LOG_LEVEL` 为更高级别（如 `info` 或 `warn`）
2. 减少 `LOG_RETENTION_DAYS` 天数
3. 使用 `LOG_TARGET=file` 避免输出到控制台

### 找不到日志文件

检查日志目录位置：

```rust
use crate::app_state::AppConfig;

let log_dir = AppConfig::base_dir().join("logs");
println!("日志目录: {}", log_dir.display());
```

## 与 open-node 日志系统的对比

| 特性     | open-app (Rust)             | open-node (Node.js) |
| -------- | --------------------------- | ------------------- |
| 日志库   | tauri-plugin-log            | pino / winston      |
| 文件轮转 | FileRotator                 | 按天自动轮转        |
| 日志级别 | trace/debug/info/warn/error | 相同                |
| 输出目标 | 控制台/文件/Webview         | 控制台/文件         |
| 配置方式 | 环境变量                    | 环境变量            |

## 技术细节

### tauri-plugin-log 特性

- **跨平台**: 支持 macOS、Windows、Linux
- **多目标输出**: 同时输出到控制台、文件、Webview
- **自动格式化**: 时间戳、日志级别、模块名
- **性能优化**: 异步写入，不阻塞主线程

### 日志格式

```
[时间戳] [日志级别] [模块名] 日志内容
```

示例：

```
2024-01-27T17:00:00.123Z [INFO] open_app_lib::app_plugins: plugins initialized
```

## 参考文档

- [tauri-plugin-log 官方文档](https://v2.tauri.app/plugin/log/)
- [Rust log crate](https://docs.rs/log/)
- [Open-Context 项目规范](../AGENTS.md)
