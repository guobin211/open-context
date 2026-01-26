# open-app

Tauri 桌面应用壳，负责文件系统操作、系统调用、启动服务。

## 职责

- **文件系统管理** - 本地文件读写、目录操作
- **系统调用** - 系统对话框、剪贴板、快捷键
- **服务管理** - 启动/停止 Node.js 后台服务
- **数据持久化** - SQLite 数据库（应用状态）
- **事件系统** - 前后端事件通信
- **异步任务** - 任务调度、进度追踪

## 技术栈

- **Runtime**: Rust
- **Framework**: Tauri 2.x
- **Database**: SQLite (sqlx)
- **Async Runtime**: tokio

## 目录结构

```
apps/open-app/
├── src/
│   ├── main.rs              # 应用入口
│   ├── lib.rs               # 库入口
│   ├── app_plugins.rs        # Tauri 插件注册
│   ├── app_state.rs         # 应用状态管理
│   ├── database/            # 数据库模块
│   │   ├── mod.rs
│   │   ├── models.rs        # 数据模型
│   │   └── queries.rs      # 数据库查询
│   ├── commands/            # Tauri 命令
│   │   ├── mod.rs
│   │   ├── workspace.rs     # 工作空间命令
│   │   ├── note.rs          # 笔记命令
│   │   ├── file.rs          # 文件命令
│   │   └── repository.rs    # 仓库命令
│   ├── task_manager/        # 异步任务管理
│   │   ├── mod.rs
│   │   ├── manager.rs      # 任务管理器
│   │   └── task.rs         # 任务结构
│   └── utils/               # 工具函数
├── Cargo.toml               # Rust 依赖
└── tauri.conf.json          # Tauri 配置
```

## 核心功能

### Tauri 命令

| 命令                   | 说明             |
| ---------------------- | ---------------- |
| `get_all_workspaces`   | 获取所有工作空间 |
| `create_workspace`     | 创建工作空间     |
| `delete_workspace`     | 删除工作空间     |
| `get_all_notes`        | 获取笔记列表     |
| `create_note`          | 创建笔记         |
| `get_all_repositories` | 获取仓库列表     |
| `create_repository`    | 创建仓库         |

### 事件系统

Rust 端通过事件系统向前端推送实时更新：

- `task:completed` - 任务完成
- `task:failed` - 任务失败
- `task:progress` - 任务进度
- `service:started` - 服务启动
- `service:stopped` - 服务停止

### 异步任务

支持长时间运行任务的异步执行和进度追踪：

- 任务状态：`pending` | `running` | `completed` | `failed` | `cancelled`
- 任务重试：支持最大重试次数配置
- 持久化：支持跨应用重启恢复任务

## 数据存储

### SQLite 数据库

**存储路径**：`~/.open-context/database/app_state.db`

**主要表**：

- `workspaces` - 工作空间表
- `notes` - 笔记表
- `tasks` - 异步任务表（持久化任务）

### Tauri Store

用于客户端状态持久化：

- `chat-store.store.json` - 聊天状态
- `workspace-store.store.json` - 工作空间状态
- `notebook-store.store.json` - 笔记状态

## 开发命令

```bash
# 开发模式（需要先启动 Node.js 服务）
pnpm dev:app

# 构建应用
pnpm build:app

# 代码检查
cargo clippy --fix

# 格式化
cargo fmt

# 运行测试
cargo test
```

## 开发指南

### 命令定义

```rust
#[tauri::command]
pub async fn create_workspace(
    dto: CreateWorkspaceDto,
    state: tauri::State<'_, AppState>,
) -> Result<Workspace, String> {
    let workspace = state.db.create_workspace(&dto).await?;
    Ok(workspace)
}
```

### 发送事件

```rust
app.emit("task:completed", serde_json::json!({
    "taskId": task_id,
    "result": result
}))?;
```

### 错误处理

使用 `anyhow::Result<T>`` 进行错误传播：

```rust
pub fn my_function() -> anyhow::Result<()> {
    let result = some_operation()?;
    Ok(())
}
```

## 相关文档

- **[Tauri 端文档](../../docs/APP_TAURI.md)** - 完整命令参考、事件系统、异步任务模式
- **[共享存储规范](../../docs/SHARED_STORAGE.md)** - 数据存储路径规范
- **[AGENTS.md](../../AGENTS.md)** - Rust 代码规范和最佳实践

## License

MIT
