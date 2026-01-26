# Tauri 端技术文档

本文档描述 Open-Context 桌面应用的 Tauri 端实现，包括 IPC 命令、事件系统和异步任务模式。

> **存储路径**：参见 [共享存储规范](./SHARED_STORAGE.md)

## 架构概述

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Web 前端                                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. invoke('command', dto)     →  调用 Tauri 命令                    │
│  2. listen('event:name')       →  监听事件                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ Tauri IPC
┌───────────────────────────────▼─────────────────────────────────────┐
│                        Rust 后端                                     │
├─────────────────────────────────────────────────────────────────────┤
│  DatabaseManager  →  SQLite 数据持久化                               │
│  TaskManager      →  异步任务管理                                    │
│  EventEmitter     →  事件发射                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 一、Tauri 命令

### 工作空间命令

| 命令                 | 参数                      | 返回值           | 描述             |
| -------------------- | ------------------------- | ---------------- | ---------------- |
| `get_all_workspaces` | -                         | `Vec<Workspace>` | 获取所有工作空间 |
| `get_workspace`      | `id: String`              | `Workspace`      | 获取工作空间     |
| `create_workspace`   | `dto: CreateWorkspaceDto` | `Workspace`      | 创建工作空间     |
| `update_workspace`   | `id, dto`                 | `Workspace`      | 更新工作空间     |
| `delete_workspace`   | `id: String`              | `bool`           | 删除工作空间     |

### 笔记命令

| 命令            | 参数                 | 返回值      | 描述         |
| --------------- | -------------------- | ----------- | ------------ |
| `get_all_notes` | `parent_id?: String` | `Vec<Note>` | 获取笔记列表 |
| `get_note`      | `id: String`         | `Note`      | 获取笔记     |
| `create_note`   | `dto: CreateNoteDto` | `Note`      | 创建笔记     |
| `update_note`   | `id, dto`            | `Note`      | 更新笔记     |
| `delete_note`   | `id: String`         | `bool`      | 删除笔记     |

### 文件命令

| 命令            | 参数                 | 返回值              | 描述         |
| --------------- | -------------------- | ------------------- | ------------ |
| `get_all_files` | `parent_id?: String` | `Vec<ImportedFile>` | 获取文件列表 |
| `get_file`      | `id: String`         | `ImportedFile`      | 获取文件     |
| `create_file`   | `dto: CreateFileDto` | `ImportedFile`      | 创建文件     |
| `update_file`   | `id, dto`            | `ImportedFile`      | 更新文件     |
| `delete_file`   | `id: String`         | `bool`              | 删除文件     |

### 仓库命令

| 命令                    | 参数                       | 返回值                | 描述         |
| ----------------------- | -------------------------- | --------------------- | ------------ |
| `get_all_repositories`  | `workspace_id: String`     | `Vec<GitRepository>`  | 获取仓库列表 |
| `get_repository`        | `id: String`               | `GitRepository`       | 获取仓库     |
| `create_repository`     | `dto: CreateRepositoryDto` | `GitRepository`       | 创建仓库     |
| `get_repository_status` | `id: String`               | `GitRepositoryStatus` | 获取仓库状态 |

### 前端调用示例

```typescript
import { invoke } from '@tauri-apps/api/core';

// 获取所有工作空间
const workspaces = await invoke<Workspace[]>('get_all_workspaces');

// 创建工作空间
const workspace = await invoke<Workspace>('create_workspace', {
  dto: { name: 'New Workspace', description: 'Test' }
});

// 错误处理
try {
  await invoke('delete_workspace', { id: 'workspace-id' });
} catch (error) {
  console.error('Failed:', error);
}
```

---

## 二、数据类型

### Workspace

```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}
```

### Note

```typescript
interface Note {
  id: string;
  title: string;
  content?: string;
  type: 'rich-text' | 'markdown' | 'code' | 'table' | 'mindmap' | 'flowchart';
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### ImportedFile

```typescript
interface FileResource {
  id: string;
  name: string;
  path: string;
  size?: number;
  type: 'file' | 'folder';
  mimeType?: string;
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### GitRepository

```typescript
interface Repository {
  id: string;
  name: string;
  url: string;
  branch?: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}
```

---

## 三、事件系统

### 事件分类

| 类别         | 事件示例                                                     |
| ------------ | ------------------------------------------------------------ |
| 应用生命周期 | `app:started`, `app:ready`, `app:quit`                       |
| 窗口管理     | `window:created`, `window:focused`, `window:resized`         |
| 应用状态     | `theme:changed`, `locale:changed`                            |
| 服务管理     | `service:started`, `service:stopped`, `service:error`        |
| 系统事件     | `notification`, `update:available`, `network:status_changed` |
| 任务事件     | `task:completed`, `task:failed`, `task:progress`             |

### Rust 端发送事件

```rust
use tauri::Emitter;

// 发送全局事件
app.emit("task:completed", serde_json::json!({
    "taskId": task_id,
    "taskType": task_type,
    "result": result
}))?;
```

### 前端监听事件

```typescript
import { listen } from '@tauri-apps/api/event';

// 监听任务完成
const unlisten = await listen('task:completed', (event) => {
  const { taskId, result } = event.payload;
  console.log(`Task ${taskId} completed`, result);
});

// 组件卸载时取消监听
onCleanup(() => unlisten());
```

### React Hook 封装

```typescript
import { useAppEvent, useThemeEvent, useServiceStatus } from '@/hooks/use-app-events';

function Dashboard() {
  const theme = useThemeEvent('system');
  const nodeServer = useServiceStatus('node-server');

  useAppEvent('task:completed', (payload) => {
    console.log('Task completed:', payload);
  });

  return <div>Theme: {theme}</div>;
}
```

---

## 四、异步任务模式

### 任务状态

```typescript
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

### TaskInfo 结构

```typescript
interface TaskInfo {
  id: string;
  taskType: string;
  status: TaskStatus;
  progress: number; // 0-100
  message?: string;
  result?: unknown;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
```

### 创建异步任务（Rust）

```rust
#[tauri::command]
pub async fn my_async_task(
    app: tauri::AppHandle,
    dto: MyTaskDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    let task = task_manager.create_task("my_task_type");
    let task_id = task.id.clone();
    let manager = task_manager.inner().clone();

    tauri::async_runtime::spawn(async move {
        manager.set_running(&task_id);
        manager.update_progress_with_emit(&task_id, 50, Some("Processing..."), &app);

        match execute_logic().await {
            Ok(result) => manager.complete_with_emit(&task_id, Some(result), &app),
            Err(e) => manager.fail_with_emit(&task_id, &e, &app),
        }
    });

    Ok(TaskHandle {
        task_id: task.id,
        task_type: task.task_type,
        status: TaskStatus::Pending,
    })
}
```

### 前端使用任务

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// 启动任务
const handle = await invoke<TaskHandle>('clone_repository_task', { dto });

// 监听进度
await listen('task:progress', (e) => {
  const { taskId, progress, message } = e.payload;
  if (taskId === handle.taskId) {
    console.log(`${progress}% - ${message}`);
  }
});

// 监听完成
await listen('task:completed', (e) => {
  if (e.payload.taskId === handle.taskId) {
    console.log('Done:', e.payload.result);
  }
});
```

### 任务持久化与重试

```rust
// 创建持久化任务（支持重启后恢复）
let task = task_manager.create_persistent_task_with_input(
    "clone_repository",
    serde_json::json!({ "url": "...", "branch": "main" }),
    3,  // 最大重试次数
);

// 应用启动时加载未完成任务
let pending = task_manager.load_persistent_tasks()?;
for task in pending {
    // 重新调度执行
}
```

---

## 五、数据库表结构

### workspaces 表

```sql
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### notes 表

```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    title TEXT NOT NULL,
    note_type TEXT NOT NULL,
    content TEXT,
    file_path TEXT NOT NULL,
    tags TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### tasks 表（持久化任务）

```sql
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    result TEXT,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    input TEXT,
    persistent INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_persistent ON tasks(persistent);
```

---

## 六、最佳实践

1. **错误处理**：所有命令使用 `Result<T, String>` 返回
2. **日志记录**：使用 `log::info!()`, `log::error!()` 记录关键操作
3. **事件通知**：长时间任务使用 `*_with_emit` 方法推送进度
4. **任务清理**：定期调用 `cleanup_tasks` 清理已完成任务
5. **持久化**：需要跨重启恢复的任务使用 `create_persistent_task`
