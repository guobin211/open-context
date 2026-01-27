# 变更：添加统一的通用日志功能

## 为什么

当前三端（open-app Rust、open-node Node.js、open-web React）使用不同的日志实现，缺乏统一的日志 API 和配置方式。这导致：

- 日志格式不一致，难以跨端追踪问题
- 缺乏日志文件管理（按天分文件、保留7天）
- 缺乏统一的日志级别控制和配置
- 生产环境无法集中管理和查看日志

## 变更内容

- **新增**统一的日志 API 设计，保持三端接口一致性
- **新增**日志文件轮转机制：按天区分日志文件，自动清理7天前的日志
- **新增**日志配置系统：支持开发/生产环境差异化配置
- **实现** open-node 端使用 pino 库，支持控制台和文件输出
- **实现** open-web 端使用 tauri-plugin-log 库，通过 Tauri 调用 Rust 端日志
- **增强** open-app Rust 端日志系统，添加文件轮转和配置管理
- **新增**日志目录：`~/.open-context/logs/`，按端分目录存储

## 影响

- **受影响规范**：logging（新增）
- **受影响代码**：
  - `apps/open-app/src/` - 新增日志模块，更新所有日志调用
  - `apps/open-node/src/utils/logger.ts` - 重为统一日志实现
  - `apps/open-web/src/lib/logger.ts` - 重为统一日志实现
  - `apps/open-node/package.json` - 更新 pino 配置
  - `apps/open-web/package.json` - 新增 tauri-plugin-log 依赖
  - `apps/open-app/Cargo.toml` - 新增日志相关依赖

## 迁移计划

1. 现有代码中已使用 `log::info!`、`logger.info()` 等日志调用，只需确保符合统一 API
2. 现有的 pino 配置和 logger 实现将被替换为统一实现
3. 确保 `~/.open-context/logs/` 目录存在且可写
4. 提供环境变量 `LOG_LEVEL` 控制日志级别（trace/debug/info/warn/error）
