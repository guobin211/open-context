# 📄 Rust Tauri 命令完整文档

本文档详细列出了所有可用的 Tauri 命令，用于与 Rust 后端通信。

## 📋 Tauri 命�列表

### 工作空间命令

| 命令                 | 参数                                  | 返回值                           | 描述             |
| -------------------- | ------------------------------------- | -------------------------------- | ---------------- |
| `get_all_workspaces` | -                                     | `Result<Vec<Workspace>, String>` | 获取所有工作空间 |
| `get_workspace(id)`  | `id: String`                          | 根据 ID 获取工作空间             |
| `create_workspace`   | `dto: CreateWorkspaceDto`             | `Result<Workspace, String>`      | 创建工作空间     |
| `update_workspace`   | `id: String, dto: UpdateWorkspaceDto` | `Result<Workspace, String>`      | 更新工作空间     |
| `delete_workspace`   | `id: String`                          | `Result<bool, String>`           | 删除工作空间     |

### 笔记命令

| 命令                        | 参数                             | 返回值                      | 描述                         |
| --------------------------- | -------------------------------- | --------------------------- | ---------------------------- |
| `get_all_notes(parent_id?)` | `parent_id?: string`             | `Result<Vec<Note>, String>` | 获取所有笔记（可选父级过滤） |
| `get_note(id)`              | `id: string`                     | `Result<Note, String>`      | 根据 ID 获取笔记             |
| `create_note`               | `dto: CreateNoteDto`             | `Result<Note, String>`      | 创建笔记                     |
| `update_note`               | `id: String, dto: UpdateNoteDto` | `Result<Note, String>`      | 更新笔记                     |
| `delete_note`               | `id: String`                     | `Result<bool, String>`      | 删除笔记                     |

### 文件命令

| 命令                        | 参数                             | 返回值                              | 描述                         |
| --------------------------- | -------------------------------- | ----------------------------------- | ---------------------------- |
| `get_all_files(parent_id?)` | `parent_id?: string`             | `Result<Vec<ImportedFile>, String>` | 获取所有文件（可选父级过滤） |
| `get_file(id)`              | `id: String`                     | `Result<ImportedFile, String>`      | 根据 ID 获取文件             |
| `create_file`               | `dto: CreateFileDto`             | `Result<ImportedFile, String>`      | 创建文件/文件夹              |
| `update_file`               | `id: String, dto: UpdateFileDto` | `Result<ImportedFile, String>`      | 更新文件                     |
| `delete_file`               | `id: String`                     | `Result<bool, String>`              | 删除文件                     |

### 仓库命令

| 命令                                 | 参数                                   | 返回值                                | 描述                   |
| ------------------------------------ | -------------------------------------- | ------------------------------------- | ---------------------- |
| `get_all_repositories(workspace_id)` | `workspace_id: String`                 | `Result<Vec<GitRepository>, String>`  | 获取工作空间的所有仓库 |
| `get_repository(id)``                | `id: String`                           | `Result<GitRepository, String>`       | 根据 ID 获取仓库       |
| `create_repository`                  | `dto: CreateRepositoryDto`             | `Result<GitRepository, String>`       | 创建仓库               |
| `update_repository`                  | `id: String, dto: UpdateRepositoryDto` | `Result<GitRepository, String>`       | 更新仓库               |
| `delete_repository`                  | `id: String`                           | `Result<bool, String>`                | 删除仓库               |
| `get_repository_status(id)`          | `id: String`                           | `Result<GitRepositoryStatus, String>` | 获取仓库状态           |

### 系统命令

| 命令   | 参数              | 返回值   | 描述         |
| ------ | ----------------- | -------- | ------------ |
| `ping` | `timestamp: &str` | `String` | 心跳检测命令 |

## 📦 数据类型

### 工作空间 (Workspace)

`rust`

```rust
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
}
```

`typescript`

```typescript
interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 笔记 (Note)

`rust`

```rust
pub struct Note {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub note_type: NoteType,
    pub content: String,
    pub file_path: PathBuf,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

`typescript`

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

### 文件 (ImportedFile)

`rust`

```rust
pub struct ImportedFile {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_type: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

`typescript`

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

### 仓库 (GitRepository)

`rust`

```rust
pub struct GitRepository {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub remote_url: String,
    pub local_path: PathBuf,
    pub branch: String,
    pub last_commit_hash: Option<String>,
    pub last_synced_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}
```

`typescript`

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

````

## 🚀 TypeScript 前端使用

### 基本用法

```typescript
import { invoke } from '@tauri-apps/api/core';

// 获取所有工作空间
const workspaces = await invoke<Workspace[]>('get_all_workspaces');

// 获取单个工作空间
const workspace = await invoke<Workspace>('get_workspace', { id: 'workspace-id' });

// 创建工作空间
const newWorkspace = await invoke<Workspace>('create_workspace', {
  dto: {
    name: 'New Workspace',
    description: 'Test description'
  }
});

// 更新工作空间
const updated = await invoke<Workspace>('update_workspace', {
  id: 'workspace-id',
  dto: {
    name: 'Updated Name',
    description: 'Updated description'
  }
});

// 删除工作空间
const deleted = await invoke<boolean>('delete_workspace', { id: 'workspace-id' });
````

### 错误处理

```typescript
import { invoke } from '@tauri-apps/api/core';

try {
  const workspaces = await invoke<Workspace[]>('get_all_workspaces');
  console.log('Workspaces:', workspaces);
} catch (error) {
  console.error('Failed to fetch workspaces:', error);
  // 处理错误
}
```

### Rust 后端实现细节

- 所有数据模型定义在 `app_state.rs` 中
- 所有数据库操作实现：`create`, `get`, `update`, `delete`
- 使用 `chrono` 自动管理时间戳（毫秒）
- 使用 `uuid::Uuid::new_v4()` 生成唯一 ID
- 使用 `Result<T, E>` 模式进行错误处理
- 使用 `log::error!()` 记录错误日志

## 🔄 数据流程

### 创建工作空间流程

```
用户操作
    ↓
前端: services.workspace.create(dto)
    ↓
Tauri: invoke('create_workspace', { dto })
    ↓
Rust: DatabaseManager.create_workspace()
    ↓
SQLite: INSERT INTO workspaces
    ↓
返回: Workspace (with auto-generated UUID)
```

### 更新工作空间流程

```
用户操作
    ↓
前端: services.workspace.update(id, dto)
    ↓
Tauri: invoke('update_workspace', { id, dto })
    ↓
Rust: DatabaseManager.update_workspace()
    ↓
SQLite: UPDATE workspaces SET name = ?1, description = ?2, updated_at = ?3
    ↓
返回: Workspace (with updated_at)
```

### 删除工作空间流程

```
用户操作
    ↓
前端: services.workspace.delete(id)
    ↓
Tauri: invoke('delete_workspace', { id })
    ↓
Rust: DatabaseManager.delete_workspace()
    ↓
SQLite: DELETE FROM workspaces WHERE id = ?1
    ↓
返回: bool
```

### 创建笔记流程

```
用户创建笔记
    ↓
前端: services.note.create(dto)
    ↓
Tauri: invoke('create_note', { dto })
    ↓
Rust: DatabaseManager.create_note()
    ↓
SQLite: INSERT INTO notes (..., tags, ...) VALUES (..., 9, ?10))
    ↓
返回: Note (with auto-generated UUID)
```

### 更新笔记流程

```
用户更新笔记
    ↓
前端: services.note.update(id, dto)
    ↓
Tauri: invoke('update_note', { id, dto })
    ↓
Rust: DatabaseManager.update_note()
    ↓
SQLite: UPDATE notes SET ... WHERE id = ?7
    ↓
返回: Note (with updated_at)
```

### 删除笔记流程

```
用户删除笔记
    ↓
前端: services.note.delete(id)
    ↓
Tauri: invoke('delete_note', { id })
    ↓
Rust: DatabaseManager.delete_note()
    ↓
SQLite: DELETE FROM notes WHERE id = ?1
    ↓
返回: bool
```

## 🔄 数据持久化

### 数据库位置

- **开发环境**: 临时目录 `env::temp_dir().join(format!("test_workspace_{}.db", uuid::Uuid::new_v4()))`
- **生产环境**: 用户数据目录
- **数据库文件**: `open-context.db`

### 表结构

- `workspaces`: 工作空间表
- `notes`: 笔记表
- `imported_files`: 导入文件表
- `imported_directories`: 导入目录表
- `git_repositories`: Git 仓库表

## ✅ 已实现的功能

#### 工作空间管理 ✅

- ✅ 获取所有工作空间
- ✅ 根据 ID 获取工作空间
- ✅ 创建工作空间
- ✅ 更新工作空间
- ✅ 删除工作空间
- ✅ 设置活动工作空间
- ✅ 获取活动工作空间
- ✅ 统计工作空间资源

#### 笔记管理 ✅

- ✅ 获取所有笔记
- ✅ 根据 ID 获取笔记
- ✅ 创建笔记笔记类型
- ✅ 更新笔记（标题、内容、类型）
- ✅ 删除笔记
- ✅ 添加/移除标签
- ✅ 搜索笔记（标题和内容）

#### 文件管理 ✅

- ✅ 获取所有文件
- ✅ 根据 ID 获取文件
- ✅ 创建文件/文件夹
- ✅ 更新文件元数据（名称、大小、类型）
- ✅ 删除文件
- ✅ 获取存储统计（文件/目录数量和大小）
- ✅ 删除目录

#### 目录管理 ✅

- ✅ 创建导入目录
- ✅ 更新目录统计（文件数量、总大小）
- ✅ 删除目录
- ✅ 获取所有目录

#### 仓库管理 ⚠️️ (基础实现)

- ✅ 创建仓库记录
- ✅ 更新仓库元数据（名称、URL、分支）
- ✅ 更新仓库状态
- ⚠️️ 创建仓库（自动添加到工作空间）

## 🎯 Rust 后端实现细节

### 数据库操作

所有 Tauri 命令都通过 `DatabaseManager` 与 SQLite 数据库交互：

```rust
// 创建工作空间
db.create_workspace(&workspace)?;

// 获取工作空间
let workspace = db.get_workspace(&id)?;

// 更新工作空间
db.update_workspace(&workspace)?;

// 删除工作空间
db.delete_workspace(&id)?;
```

### 错误处理

Tauri 命令使用 `Result<T, E>` 模式处理错误：

```rust
#[tauri::command]
pub fn get_workspace(id: String) -> Result<Workspace, String> {
    let db = DatabaseManager::get_instance();
    match db.get_workspace(&id) {
        Ok(Some(workspace)) => Ok(workspace),
        Ok(None) => Err(format!("Workspace not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch workspace: {}", e)),
    }
}
```

## 📋 数据库表结构

- `workspaces`: 工作空间表
- `notes`: 笔记表
- `imported_files`: 导入文件表
- `imported_directories`: 导入目录表
- `git_repositories`: Git 仓库表

## ✅ 测试

Rust 后端包含完整的单元测试：

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_get_workspace() {
        let (db, workspace) = setup_test_db();
        let workspace = Workspace::new("Test Workspace".to_string(), None);

        db.create_workspace(&workspace).unwrap();
        let retrieved = db.get_workspace(&workspace.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, workspace.id);
        assert_eq!(retrieved.name, "Test Workspace");
    }

    #[test]
    fn test_list_workspaces() {
        let (db, workspace) = setup_test_db();

        let ws1 = Workspace::new("Workspace 1".to_string(), None);
        let ws2 = Workspace::new("Workspace 2".to_string(), None);

        db.create_workspace(&ws1).unwrap();
        db.create_workspace(&ws2).unwrap();

        let workspaces = db.list_workspaces().unwrap();
        assert_eq!(workspaces.len(), 2);
    }

    #[test]
    fn test_update_workspace() {
        let (db, workspace) = setup_test_db();
        let mut workspace = Workspace::new("Original Name".to_string(), None);

        db.create_workspace(&workspace).unwrap();

        workspace.name = "Updated Name";
        workspace.description = Some("New description".to_string());

        db.update_workspace(&workspace).unwrap();

        let updated = db.get_workspace(&workspace.id).unwrap();
        assert!(updated.is_some());
        let updated = updated.unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.description, Some("New description".to_string()));
    }

    #[test]
    fn test_delete_workspace() {
        let (db, workspace) = setup_test_db();
        let workspace = Workspace::new("To Delete".to_string(), None);

        db.create_workspace(&workspace).unwrap();

        let deleted = db.delete_workspace(&workspace.id).unwrap();

        assert!(deleted);
    }
}
```

## 🚀 TypeScript 前端使用

### 基本用法

```typescript
import { invoke } from '@tauri-apps/api/core';

// 获取所有工作空间
const workspaces = await invoke<Workspace[]>('get_all_workspaces');

// 获取单个工作空间
const workspace = await invoke<Workspace>('get_workspace', { id: 'workspace-id' });

// 创建工作空间
const newWorkspace = await invoke<Workspace>('create_workspace', {
  dto: {
    name: 'New Workspace',
    description: 'Test description'
  }
});

// 更新工作空间
const updated = await invoke<Workspace>('update_workspace', {
  id: 'workspace-id',
  dto: {
    name: 'Updated Name',
    description: 'Updated description'
  }
});

// 删除工作空间
const deleted = await invoke<boolean>('delete_workspace', { id: 'workspace-id' });
```

### 错误处理

```typescript
import { invoke } from '@tauri-apps/api/core';

try {
  const workspaces = await invoke<Workspace[]>('get_all_workspaces');
  console.log('Workspaces:', workspaces);
} catch (error) {
  console.error('Failed to fetch workspaces:', error);
  // 处理错误
}
```

### Rust 后端实现细节

- 所有数据模型定义在 `app_state.rs` 中
- 所有数据库操作实现：`create`, `get`, `update`, `delete`
- 使用 `chrono` 自动管理时间戳（毫秒）
- 使用 `uuid::Uuid::new_v4()` 生成唯一 ID
- 使用 `Result<T, E>` 模式进行错误处理
- 使用 `log::error!()` 记录错误日志

## 🔄 数据流程

### 创建工作空间流程

```
用户操作
    ↓
前端: services.workspace.create(dto)
    ↓
Tauri: invoke('create_workspace', { dto })
    ↓
Rust: DatabaseManager.create_workspace()
    ↓
SQLite: INSERT INTO workspaces
    ↓
返回: Workspace (with auto-generated UUID)
```

### 更新工作空间流程

```
用户操作
    ↓
前端: services.workspace.update(id, dto)
    ↓
Tauri: invoke('update_workspace', { id, dto })
    ↓
Rust: DatabaseManager.update_workspace()
    ↓
SQLite: UPDATE workspaces SET name = ?1, description = ?2, updated_at = ?3
    ↓
返回: Workspace (with updated_at)
```

### 删除工作空间流程

```
用户操作
    ↓
前端: services.workspace.delete(id)
    ↓
Tauri: invoke('delete_workspace', { id })
    ↓
Rust: DatabaseManager.delete_workspace()
    ↓
SQLite: DELETE FROM workspaces WHERE id = ?1
    ↓
返回: bool
```

### 创建笔记流程

```
用户创建笔记
    ↓
前端: services.note.create(dto)
    ↓
Tauri: invoke('create_note', { dto })
    ↓
Rust: DatabaseManager.create_note()
    ↓
SQLite: INSERT INTO notes (..., tags, ...) VALUES (..., 9, ?10))
    ↓
返回: Note (with auto-generated UUID)
```

### 更新笔记流程

```
用户更新笔记
    ↓
前端: services.note.update(id, dto)
    ↓
Tauri: invoke('update_note', { id, dto)
    ↓
Rust: DatabaseManager.update_note()
    ↓
SQLite: UPDATE notes SET ... WHERE id = ?7
    ↓
返回: Note (with updated_at)
```

### 删除笔记流程

```
用户删除笔记
    ↓
前端: services.note.delete(id)
    ↓
Tauri: invoke('delete_note', { id })
    ↓
Rust: DatabaseManager.delete_note()
    ↓
SQLite: DELETE FROM notes WHERE id = ?1
    ↓
返回: bool
```
