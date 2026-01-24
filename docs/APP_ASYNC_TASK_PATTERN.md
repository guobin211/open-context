# Tauri 异步任务模式技术文档

本文档描述 Tauri 应用中异步任务的设计模式，支持任务创建、状态查询、进度追踪和结果获取。

## 架构概述

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Web 前端                                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. invoke('xxx_task', dto)  →  立即返回 TaskHandle                  │
│  2. invoke('get_task', id)   →  轮询任务状态                         │
│  3. listen('task:completed') →  监听任务完成事件                     │
│  4. listen('task:progress')  →  监听进度更新事件                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ Tauri IPC
┌───────────────────────────────▼─────────────────────────────────────┐
│                        Rust 后端                                     │
├─────────────────────────────────────────────────────────────────────┤
│  TaskManager (全局状态)                                              │
│  ├── create_task(type) → TaskInfo                                   │
│  ├── get_task(id) → Option<TaskInfo>                                │
│  ├── update_progress(id, progress, message)                         │
│  ├── complete(id, result)                                           │
│  ├── fail(id, error)                                                │
│  └── cancel(id)                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  tauri::async_runtime::spawn                                        │
│  └── 异步执行实际业务逻辑                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## 核心数据结构

### TaskStatus - 任务状态枚举

```rust
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,    // 待执行：任务已创建，等待执行
    Running,    // 执行中：任务正在执行
    Completed,  // 已完成：任务执行成功
    Failed,     // 已失败：任务执行出错
    Cancelled,  // 已取消：任务被用户取消
}
```

### TaskInfo - 任务详细信息

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskInfo {
    pub id: String,                        // 任务唯一标识（UUID）
    pub task_type: String,                 // 任务类型标识
    pub status: TaskStatus,                // 当前状态
    pub progress: u8,                      // 进度百分比（0-100）
    pub message: Option<String>,           // 当前执行阶段描述
    pub result: Option<serde_json::Value>, // 执行结果（泛型 JSON）
    pub error: Option<String>,             // 错误信息
    pub created_at: i64,                   // 创建时间戳（毫秒）
    pub updated_at: i64,                   // 最后更新时间戳
    pub completed_at: Option<i64>,         // 完成时间戳
}
```

### TaskHandle - 任务句柄（返回给前端）

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskHandle {
    pub task_id: String,     // 任务 ID
    pub task_type: String,   // 任务类型
    pub status: TaskStatus,  // 初始状态（通常为 Pending）
}
```

## TaskManager - 任务管理器

### 初始化

在 Tauri 应用启动时注册为全局状态：

```rust
// main.rs 或 lib.rs
use crate::app_service::TaskManager;

tauri::Builder::default()
    .manage(TaskManager::new())
    // ...
```

### 核心方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `create_task` | `fn create_task(&self, task_type: impl Into<String>) -> TaskInfo` | 创建新任务 |
| `get_task` | `fn get_task(&self, task_id: &str) -> Option<TaskInfo>` | 获取任务信息 |
| `list_tasks` | `fn list_tasks(&self) -> Vec<TaskInfo>` | 列出所有任务 |
| `list_tasks_by_type` | `fn list_tasks_by_type(&self, task_type: &str) -> Vec<TaskInfo>` | 按类型列出任务 |
| `set_running` | `fn set_running(&self, task_id: &str)` | 设置为执行中 |
| `update_progress` | `fn update_progress(&self, task_id: &str, progress: u8, message: Option<String>)` | 更新进度 |
| `complete` | `fn complete(&self, task_id: &str, result: Option<serde_json::Value>)` | 标记完成 |
| `fail` | `fn fail(&self, task_id: &str, error: impl Into<String>)` | 标记失败 |
| `cancel` | `fn cancel(&self, task_id: &str) -> bool` | 取消任务 |
| `cleanup_completed` | `fn cleanup_completed(&self, max_age_ms: i64)` | 清理已完成任务 |

### 带事件推送的方法

以下方法在更新任务状态的同时，会自动向前端发送 Tauri 事件通知：

| 方法 | 签名 | 事件 | 描述 |
|------|------|------|------|
| `complete_with_emit` | `fn complete_with_emit<R: tauri::Runtime>(&self, task_id: &str, result: Option<serde_json::Value>, app: &tauri::AppHandle<R>)` | `task:completed` | 完成任务并推送事件 |
| `fail_with_emit` | `fn fail_with_emit<R: tauri::Runtime>(&self, task_id: &str, error: impl Into<String>, app: &tauri::AppHandle<R>)` | `task:failed` | 失败任务并推送事件 |
| `cancel_with_emit` | `fn cancel_with_emit<R: tauri::Runtime>(&self, task_id: &str, app: &tauri::AppHandle<R>) -> bool` | `task:cancelled` | 取消任务并推送事件 |
| `update_progress_with_emit` | `fn update_progress_with_emit<R: tauri::Runtime>(&self, task_id: &str, progress: u8, message: Option<String>, app: &tauri::AppHandle<R>)` | `task:progress` | 更新进度并推送事件 |

### 事件推送 Payload 格式

```typescript
// task:completed
{
  taskId: string;
  taskType: string;
  result?: unknown;
}

// task:failed
{
  taskId: string;
  taskType: string;
  error: string;
}

// task:cancelled
{
  taskId: string;
  taskType: string;
}

// task:progress
{
  taskId: string;
  taskType: string;
  progress: number;
  message?: string;
}
```

## Tauri Command 实现模式

### 标准异步任务模板

```rust
use crate::app_service::{TaskHandle, TaskManager, TaskStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MyTaskDto {
    pub param1: String,
    pub param2: Option<i32>,
}

#[tauri::command]
pub async fn my_async_task(
    app: tauri::AppHandle,
    dto: MyTaskDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    // 1. 创建任务记录
    let task = task_manager.create_task("my_task_type");
    let task_id = task.id.clone();
    let task_type = task.task_type.clone();

    // 2. 构建返回给前端的句柄
    let handle = TaskHandle {
        task_id: task_id.clone(),
        task_type: task_type.clone(),
        status: TaskStatus::Pending,
    };

    // 3. 克隆需要移入异步块的数据
    let manager = task_manager.inner().clone();
    let param1 = dto.param1.clone();

    // 4. 启动异步任务
    tauri::async_runtime::spawn(async move {
        // 设置为运行中
        manager.set_running(&task_id);
        log::info!("Task started: {}", task_id);

        // 执行实际业务逻辑
        let result = execute_task_logic(&manager, &app, &task_id, &param1).await;

        // 处理结果（使用带事件推送的方法）
        match result {
            Ok(value) => {
                manager.complete_with_emit(&task_id, Some(value), &app);
                log::info!("Task completed: {}", task_id);
            }
            Err(e) => {
                manager.fail_with_emit(&task_id, &e, &app);
                log::error!("Task failed: {} - {}", task_id, e);
            }
        }
    });

    // 5. 立即返回句柄
    Ok(handle)
}

async fn execute_task_logic(
    manager: &TaskManager,
    app: &tauri::AppHandle,
    task_id: &str,
    param: &str,
) -> Result<serde_json::Value, String> {
    // 阶段 1（使用带事件推送的方法）
    manager.update_progress_with_emit(task_id, 10, Some("Initializing...".to_string()), app);
    // ... 执行逻辑
    
    // 阶段 2
    manager.update_progress_with_emit(task_id, 50, Some("Processing...".to_string()), app);
    // ... 执行逻辑
    
    // 阶段 3
    manager.update_progress_with_emit(task_id, 90, Some("Finalizing...".to_string()), app);
    // ... 执行逻辑
    
    Ok(serde_json::json!({
        "status": "success",
        "data": param
    }))
}
```

### 方法选择指南

| 场景 | 推荐方法 |
|------|----------|
| 需要前端实时响应（进度条、状态更新） | 使用 `*_with_emit` 方法 |
| 前端使用轮询方式查询状态 | 使用普通方法（无 emit） |
| 后台任务，无需前端感知 | 使用普通方法（无 emit） |
| 长时间任务需要进度反馈 | 使用 `update_progress_with_emit` |
```

### 支持取消的任务模板

```rust
use tokio_util::sync::CancellationToken;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

// 扩展 TaskManager 支持取消令牌
pub struct TaskManagerWithCancel {
    tasks: Arc<Mutex<HashMap<String, TaskInfo>>>,
    cancel_tokens: Arc<Mutex<HashMap<String, CancellationToken>>>,
}

impl TaskManagerWithCancel {
    pub fn create_cancellable_task(&self, task_type: impl Into<String>) -> (TaskInfo, CancellationToken) {
        let task = TaskInfo::new(task_type);
        let token = CancellationToken::new();
        
        {
            let mut tasks = self.tasks.lock().unwrap();
            tasks.insert(task.id.clone(), task.clone());
        }
        {
            let mut tokens = self.cancel_tokens.lock().unwrap();
            tokens.insert(task.id.clone(), token.clone());
        }
        
        (task, token)
    }

    pub fn cancel_with_token(&self, task_id: &str) -> bool {
        let token = {
            let tokens = self.cancel_tokens.lock().unwrap();
            tokens.get(task_id).cloned()
        };
        
        if let Some(token) = token {
            token.cancel();
            self.update_status(task_id, TaskStatus::Cancelled);
            return true;
        }
        false
    }
}

// 可取消任务示例
#[tauri::command]
pub async fn cancellable_task(
    app: tauri::AppHandle,
    dto: MyTaskDto,
    task_manager: tauri::State<'_, TaskManagerWithCancel>,
) -> Result<TaskHandle, String> {
    let (task, cancel_token) = task_manager.create_cancellable_task("cancellable_task");
    let task_id = task.id.clone();
    let manager = task_manager.inner().clone();

    tauri::async_runtime::spawn(async move {
        manager.set_running(&task_id);
        
        // 检查取消状态的循环
        for i in 0..100 {
            // 检查是否被取消
            if cancel_token.is_cancelled() {
                log::info!("Task cancelled: {}", task_id);
                return;
            }
            
            manager.update_progress(&task_id, i as u8, Some(format!("Step {}/100", i)));
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;
        }
        
        manager.complete(&task_id, Some(serde_json::json!({"status": "done"})));
    });

    Ok(TaskHandle {
        task_id: task.id,
        task_type: task.task_type,
        status: TaskStatus::Pending,
    })
}
```

## 前端调用模式

### TypeScript 类型定义

```typescript
// types/task.ts
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskHandle {
  taskId: string;
  taskType: string;
  status: TaskStatus;
}

export interface TaskInfo {
  id: string;
  taskType: string;
  status: TaskStatus;
  progress: number;
  message?: string;
  result?: unknown;
  error?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface TaskEvent {
  taskId: string;
  taskType: string;
  error?: string;
}
```

### 任务服务封装

```typescript
// services/task-service.ts
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import type { TaskHandle, TaskInfo, TaskEvent } from '@/types/task';

export const taskService = {
  /**
   * 获取单个任务信息
   */
  async getTask(taskId: string): Promise<TaskInfo> {
    return invoke<TaskInfo>('get_task', { taskId });
  },

  /**
   * 获取所有任务列表
   */
  async listTasks(taskType?: string): Promise<TaskInfo[]> {
    return invoke<TaskInfo[]>('list_tasks', { taskType });
  },

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    return invoke<boolean>('cancel_task', { taskId });
  },

  /**
   * 清理已完成任务
   */
  async cleanupTasks(maxAgeMs?: number): Promise<void> {
    return invoke<void>('cleanup_tasks', { maxAgeMs });
  },

  /**
   * 监听任务完成事件
   */
  onTaskCompleted(callback: (event: TaskEvent) => void): Promise<UnlistenFn> {
    return listen<TaskEvent>('task:completed', (e) => callback(e.payload));
  },

  /**
   * 监听任务失败事件
   */
  onTaskFailed(callback: (event: TaskEvent) => void): Promise<UnlistenFn> {
    return listen<TaskEvent>('task:failed', (e) => callback(e.payload));
  },

  /**
   * 监听任务取消事件
   */
  onTaskCancelled(callback: (event: TaskEvent) => void): Promise<UnlistenFn> {
    return listen<TaskEvent>('task:cancelled', (e) => callback(e.payload));
  },

  /**
   * 监听任务进度事件
   */
  onTaskProgress(callback: (event: TaskEvent & { progress: number; message?: string }) => void): Promise<UnlistenFn> {
    return listen('task:progress', (e) => callback(e.payload as TaskEvent & { progress: number; message?: string }));
  },
};
```

### React Hook 封装

```typescript
// hooks/use-task.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { taskService } from '@/services/task-service';
import type { TaskInfo, TaskHandle } from '@/types/task';

interface UseTaskOptions {
  pollingInterval?: number;
  onCompleted?: (task: TaskInfo) => void;
  onFailed?: (task: TaskInfo) => void;
}

export const useTask = (taskHandle: TaskHandle | null, options: UseTaskOptions = {}) => {
  const { pollingInterval = 1000, onCompleted, onFailed } = options;
  const [task, setTask] = useState<TaskInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<number>();

  const fetchTask = useCallback(async () => {
    if (!taskHandle) return;
    
    try {
      const info = await taskService.getTask(taskHandle.taskId);
      setTask(info);
      
      if (info.status === 'completed') {
        onCompleted?.(info);
        clearInterval(intervalRef.current);
      } else if (info.status === 'failed') {
        onFailed?.(info);
        clearInterval(intervalRef.current);
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
    }
  }, [taskHandle, onCompleted, onFailed]);

  useEffect(() => {
    if (!taskHandle) return;

    setLoading(true);
    fetchTask().finally(() => setLoading(false));

    // 轮询任务状态
    intervalRef.current = window.setInterval(fetchTask, pollingInterval);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [taskHandle, fetchTask, pollingInterval]);

  const cancel = useCallback(async () => {
    if (!taskHandle) return false;
    return taskService.cancelTask(taskHandle.taskId);
  }, [taskHandle]);

  return {
    task,
    loading,
    cancel,
    isCompleted: task?.status === 'completed',
    isFailed: task?.status === 'failed',
    isRunning: task?.status === 'running',
    isPending: task?.status === 'pending',
  };
};
```

### 使用示例

```typescript
// components/clone-repository.tsx
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTask } from '@/hooks/use-task';
import type { TaskHandle } from '@/types/task';

interface CloneRepositoryDto {
  url: string;
  branch?: string;
}

export const CloneRepository = () => {
  const [taskHandle, setTaskHandle] = useState<TaskHandle | null>(null);

  const { task, cancel, isRunning, isCompleted, isFailed } = useTask(taskHandle, {
    onCompleted: (task) => {
      console.log('Clone completed:', task.result);
    },
    onFailed: (task) => {
      console.error('Clone failed:', task.error);
    },
  });

  const handleClone = async () => {
    try {
      const handle = await invoke<TaskHandle>('clone_repository_task', {
        dto: {
          url: 'https://github.com/user/repo.git',
          branch: 'main',
        } as CloneRepositoryDto,
      });
      setTaskHandle(handle);
    } catch (error) {
      console.error('Failed to start clone:', error);
    }
  };

  return (
    <div>
      <button onClick={handleClone} disabled={isRunning}>
        {isRunning ? 'Cloning...' : 'Clone Repository'}
      </button>

      {task && (
        <div>
          <p>Status: {task.status}</p>
          <p>Progress: {task.progress}%</p>
          {task.message && <p>Message: {task.message}</p>}
          {isRunning && <button onClick={cancel}>Cancel</button>}
          {isCompleted && <p>Result: {JSON.stringify(task.result)}</p>}
          {isFailed && <p>Error: {task.error}</p>}
        </div>
      )}
    </div>
  );
};
```

## 事件通知模式

### Rust 端事件发送

推荐使用 TaskManager 的 `*_with_emit` 方法自动发送事件，无需手动调用 `app.emit()`：

```rust
// 推荐：使用内置方法
manager.complete_with_emit(&task_id, Some(result), &app);
manager.fail_with_emit(&task_id, "Error message", &app);
manager.cancel_with_emit(&task_id, &app);
manager.update_progress_with_emit(&task_id, 50, Some("Processing...".to_string()), &app);
```

如需手动发送自定义事件：

```rust
use tauri::Emitter;

// 进度更新事件
let _ = app.emit("task:progress", serde_json::json!({
    "taskId": task_id,
    "taskType": task_type,
    "progress": progress,
    "message": message
}));

// 完成事件
let _ = app.emit("task:completed", serde_json::json!({
    "taskId": task_id,
    "taskType": task_type,
    "result": result
}));

// 失败事件
let _ = app.emit("task:failed", serde_json::json!({
    "taskId": task_id,
    "taskType": task_type,
    "error": error_message
}));

// 取消事件
let _ = app.emit("task:cancelled", serde_json::json!({
    "taskId": task_id,
    "taskType": task_type
}));
```

### 前端事件监听

```typescript
import { listen } from '@tauri-apps/api/event';

// 监听任务完成事件
const unlistenCompleted = await listen('task:completed', (event) => {
  const { taskId, taskType, result } = event.payload as {
    taskId: string;
    taskType: string;
    result?: unknown;
  };
  console.log(`Task ${taskId} (${taskType}) completed`, result);
});

// 监听任务失败事件
const unlistenFailed = await listen('task:failed', (event) => {
  const { taskId, taskType, error } = event.payload as {
    taskId: string;
    taskType: string;
    error: string;
  };
  console.error(`Task ${taskId} (${taskType}) failed: ${error}`);
});

// 监听任务取消事件
const unlistenCancelled = await listen('task:cancelled', (event) => {
  const { taskId, taskType } = event.payload as {
    taskId: string;
    taskType: string;
  };
  console.log(`Task ${taskId} (${taskType}) cancelled`);
});

// 监听进度更新
const unlistenProgress = await listen('task:progress', (event) => {
  const { taskId, taskType, progress, message } = event.payload as {
    taskId: string;
    taskType: string;
    progress: number;
    message?: string;
  };
  console.log(`Task ${taskId}: ${progress}% - ${message}`);
});

// 组件卸载时取消监听
onCleanup(() => {
  unlistenCompleted();
  unlistenFailed();
  unlistenCancelled();
  unlistenProgress();
});
```

## 任务持久化

### 概述

任务持久化功能已内置于 `TaskManager`，支持：
- 任务数据自动同步到 SQLite
- 应用重启后加载未完成任务
- 失败任务自动重试

### 初始化带持久化的 TaskManager

```rust
// lib.rs 或 main.rs
use crate::app_state::DatabaseManager;
use crate::app_service::TaskManager;

let db_manager = DatabaseManager::new(db_path)?;
let task_manager = TaskManager::with_persistence(db_manager.conn());

// 应用启动时加载未完成的持久化任务
let pending_tasks = task_manager.load_persistent_tasks()?;
log::info!("Loaded {} pending tasks", pending_tasks.len());

tauri::Builder::default()
    .manage(task_manager)
    // ...
```

### 创建持久化任务

```rust
// 创建普通持久化任务
let task = task_manager.create_persistent_task("clone_repository");

// 创建带输入参数的持久化任务（支持重试）
let task = task_manager.create_persistent_task_with_input(
    "clone_repository",
    serde_json::json!({
        "url": "https://github.com/user/repo.git",
        "branch": "main"
    }),
    3,  // 最大重试次数
);
```

### TaskInfo 扩展字段

```rust
pub struct TaskInfo {
    // ... 原有字段
    pub retry_count: u8,       // 当前重试次数
    pub max_retries: u8,       // 最大重试次数（默认 3）
    pub retry_delay_ms: u64,   // 重试延迟（默认 1000ms）
    pub input: Option<Value>,  // 任务输入参数（用于重试）
    pub persistent: bool,      // 是否持久化
}
```

### 持久化相关方法

| 方法 | 签名 | 描述 |
|------|------|------|
| `with_persistence` | `fn with_persistence(conn: Arc<Mutex<Connection>>) -> Self` | 创建带持久化的 TaskManager |
| `load_persistent_tasks` | `fn load_persistent_tasks(&self) -> Result<Vec<TaskInfo>, String>` | 加载未完成的持久化任务 |
| `load_retryable_tasks` | `fn load_retryable_tasks(&self) -> Result<Vec<TaskInfo>, String>` | 加载可重试的失败任务 |
| `create_persistent_task` | `fn create_persistent_task(&self, task_type: impl Into<String>) -> TaskInfo` | 创建持久化任务 |
| `create_persistent_task_with_input` | `fn create_persistent_task_with_input(&self, task_type, input, max_retries) -> TaskInfo` | 创建带输入的持久化任务 |
| `retry_task` | `fn retry_task(&self, task_id: &str) -> Option<TaskInfo>` | 重试失败任务 |
| `retry_task_with_emit` | `fn retry_task_with_emit<R>(&self, task_id: &str, app: &AppHandle<R>) -> Option<TaskInfo>` | 重试任务并发送事件 |

### 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    task_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    result TEXT,
    error TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    retry_delay_ms INTEGER NOT NULL DEFAULT 1000,
    input TEXT,
    persistent INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    completed_at INTEGER
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_persistent ON tasks(persistent);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

## 任务重试机制

### 自动重试流程

```
任务失败
    ↓
检查 can_retry()
    ↓ (retry_count < max_retries)
调用 retry_task()
    ↓
increment_retry()
    ├── retry_count += 1
    ├── status = Pending
    ├── error = None
    └── progress = 0
    ↓
重新执行任务逻辑
```

### 实现带重试的任务

```rust
#[tauri::command]
pub async fn clone_repository_task(
    app: tauri::AppHandle,
    dto: CloneRepositoryDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    // 创建持久化任务，支持最多 3 次重试
    let task = task_manager.create_persistent_task_with_input(
        "clone_repository",
        serde_json::to_value(&dto).unwrap(),
        3,
    );
    let task_id = task.id.clone();
    let manager = task_manager.inner().clone();

    tauri::async_runtime::spawn(async move {
        execute_with_retry(&manager, &app, &task_id).await;
    });

    Ok(TaskHandle {
        task_id: task.id,
        task_type: task.task_type,
        status: TaskStatus::Pending,
    })
}

async fn execute_with_retry(
    manager: &TaskManager,
    app: &tauri::AppHandle,
    task_id: &str,
) {
    loop {
        manager.set_running(task_id);

        let task = manager.get_task(task_id);
        if task.is_none() {
            return;
        }
        let task = task.unwrap();

        // 从 input 中恢复参数
        let input = task.input.clone();

        // 执行任务逻辑
        let result = do_clone_work(manager, app, task_id, input).await;

        match result {
            Ok(value) => {
                manager.complete_with_emit(task_id, Some(value), app);
                return;
            }
            Err(e) => {
                manager.fail_with_emit(task_id, &e, app);

                // 检查是否可以重试
                if let Some(task) = manager.retry_task_with_emit(task_id, app) {
                    log::info!("Retrying task {} (attempt {}/{})", task_id, task.retry_count, task.max_retries);
                    // 等待重试延迟
                    tokio::time::sleep(std::time::Duration::from_millis(task.retry_delay_ms)).await;
                    continue;
                } else {
                    log::error!("Task {} failed after all retries", task_id);
                    return;
                }
            }
        }
    }
}
```

### 前端监听重试事件

```typescript
// 监听任务重试事件
const unlistenRetry = await listen('task:retry', (event) => {
  const { taskId, taskType, retryCount, maxRetries } = event.payload as {
    taskId: string;
    taskType: string;
    retryCount: number;
    maxRetries: number;
  };
  console.log(`Task ${taskId} retrying (${retryCount}/${maxRetries})`);
});
```

## 应用启动时恢复任务

```rust
// lib.rs 或 main.rs
fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let task_manager = app.state::<TaskManager>();

    // 加载未完成的持久化任务
    let pending_tasks = task_manager.load_persistent_tasks()?;

    // 重新调度任务
    for task in pending_tasks {
        log::info!("Resuming task: {} ({})", task.id, task.task_type);
        // 根据 task_type 分发到对应的执行器
        match task.task_type.as_str() {
            "clone_repository" => {
                let manager = task_manager.inner().clone();
                let app_handle = app.handle().clone();
                let task_id = task.id.clone();
                tauri::async_runtime::spawn(async move {
                    execute_with_retry(&manager, &app_handle, &task_id).await;
                });
            }
            // ... 其他任务类型
            _ => {
                log::warn!("Unknown task type: {}", task.task_type);
            }
        }
    }

    Ok(())
}
```

## 已实现的任务命令

| 命令 | DTO | 描述 |
|------|-----|------|
| `clone_repository_task` | `CloneRepositoryTaskDto` | 克隆 Git 仓库 |
| `index_repository_task` | `IndexRepositoryTaskDto` | 索引仓库代码 |
| `import_files_task` | `ImportFilesTaskDto` | 批量导入文件 |

## 最佳实践

1. **任务类型命名**：使用 `snake_case`，如 `clone_repository`、`import_files`
2. **进度更新**：关键阶段更新进度，避免频繁更新（建议间隔 > 100ms）
3. **错误处理**：始终捕获异常并调用 `fail()` 方法
4. **事件通知**：任务完成/失败时发送事件，前端可选择监听或轮询
5. **清理策略**：定期调用 `cleanup_tasks` 清理已完成任务（建议保留 1 小时）
6. **取消支持**：长时间任务应支持取消，使用 `CancellationToken` 模式
7. **持久化任务**：需要跨重启恢复的任务使用 `create_persistent_task_with_input`
8. **重试机制**：网络相关任务建议设置 `max_retries = 3`，IO 任务可设为 `1`
