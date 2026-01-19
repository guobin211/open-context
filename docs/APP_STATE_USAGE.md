# AppState 使用指南

## 概述

`AppState` 是 Open-Context 的核心状态管理模块，提供了完整的数据持久化和管理功能。基于 SQLite 数据库，支持工作空间、笔记、文件、Git 仓库和网页链接的 CRUD 操作。

## 核心特性

- **工作空间管理**：支持多工作空间，可以隔离不同项目的数据
- **多模态笔记**：支持 6 种笔记类型（富文本、Markdown、代码、表格、思维导图、流程图）
- **文件管理**：导入和管理文件及文件夹
- **Git 仓库集成**：管理多个 Git 仓库的元数据和同步状态
- **网页链接收藏**：收藏和管理网页链接
- **线程安全**：所有操作都是线程安全的，支持并发访问

## 快速开始

### 1. 初始化 AppState

```rust
use open_context_lib::AppState;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 创建 AppState 实例
    let app_state = AppState::new()?;

    // 访问数据库管理器
    let db = app_state.db();

    // 访问配置
    let config = app_state.config();
    println!("工作空间目录: {:?}", config.workspaces_dir);

    Ok(())
}
```

### 2. 工作空间管理

```rust
use open_context_lib::{AppState, Workspace};

fn workspace_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();

    // 创建工作空间
    let workspace = Workspace::new(
        "我的项目".to_string(),
        Some("这是一个演示项目".to_string())
    );
    db.create_workspace(&workspace)?;

    // 设置为活跃工作空间
    db.set_active_workspace(&workspace.id)?;

    // 获取活跃工作空间
    if let Some(active_ws) = db.get_active_workspace()? {
        println!("当前工作空间: {}", active_ws.name);
    }

    // 列出所有工作空间
    let workspaces = db.list_workspaces()?;
    for ws in workspaces {
        println!("- {}: {}", ws.name, ws.description.unwrap_or_default());
    }

    // 统计工作空间资源数量
    let counts = db.count_workspace_resources(&workspace.id)?;
    println!("笔记: {}, 文件: {}, 仓库: {}",
        counts.notes, counts.files, counts.repositories);

    Ok(())
}
```

### 3. 笔记管理

```rust
use open_context_lib::{AppState, Note, NoteType};
use std::path::PathBuf;

fn note_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();

    // 假设我们有一个工作空间
    let workspace_id = "workspace-id".to_string();

    // 创建 Markdown 笔记
    let note = Note::new(
        workspace_id.clone(),
        "项目计划".to_string(),
        NoteType::Markdown,
        "# 项目计划\n\n## Q1 目标\n- 完成基础功能".to_string(),
        PathBuf::from("/workspaces/notes/project-plan.md")
    );
    db.create_note(&note)?;

    // 添加标签
    db.add_note_tag(&note.id, "计划")?;
    db.add_note_tag(&note.id, "重要")?;

    // 列出所有笔记
    let notes = db.list_notes(&workspace_id)?;
    for note in notes {
        println!("- [{}] {}", note.note_type.as_str(), note.title);
    }

    // 按类型筛选
    let markdown_notes = db.list_notes_by_type(&workspace_id, NoteType::Markdown)?;
    println!("Markdown 笔记数: {}", markdown_notes.len());

    // 搜索笔记
    let search_results = db.search_notes(&workspace_id, "项目")?;
    println!("搜索结果: {} 条", search_results.len());

    // 更新笔记
    let mut updated_note = db.get_note(&note.id)?.unwrap();
    updated_note.content = "# 项目计划（已更新）\n\n## Q1 目标\n- ✅ 完成基础功能".to_string();
    db.update_note(&updated_note)?;

    Ok(())
}
```

### 4. 文件和文件夹管理

```rust
use open_context_lib::{AppState, ImportedFile, ImportedDirectory};
use std::path::PathBuf;

fn file_management_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();
    let workspace_id = "workspace-id".to_string();

    // 导入文件
    let file = ImportedFile::new(
        workspace_id.clone(),
        "design.pdf".to_string(),
        PathBuf::from("/Users/me/Documents/design.pdf"),
        PathBuf::from("/workspaces/files/design.pdf"),
        "pdf".to_string(),
        2_048_000, // 2MB
    );
    db.create_imported_file(&file)?;

    // 导入文件夹
    let mut directory = ImportedDirectory::new(
        workspace_id.clone(),
        "images".to_string(),
        PathBuf::from("/Users/me/Pictures/project-images"),
        PathBuf::from("/workspaces/directories/images"),
    );
    directory.file_count = 25;
    directory.total_size_bytes = 10_485_760; // 10MB
    db.create_imported_directory(&directory)?;

    // 列出文件
    let files = db.list_imported_files(&workspace_id)?;
    for file in files {
        println!("文件: {} ({} bytes)", file.name, file.size_bytes);
    }

    // 获取存储统计
    let stats = db.get_workspace_storage_stats(&workspace_id)?;
    println!("总存储: {} bytes ({} 个文件, {} 个目录)",
        stats.total_size_bytes, stats.files_count, stats.directories_count);

    Ok(())
}
```

### 5. Git 仓库管理

```rust
use open_context_lib::{AppState, GitRepository};
use std::path::PathBuf;

fn git_repository_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();
    let workspace_id = "workspace-id".to_string();

    // 添加 Git 仓库
    let repo = GitRepository::new(
        workspace_id.clone(),
        "open-context".to_string(),
        "https://github.com/user/open-context.git".to_string(),
        PathBuf::from("/workspaces/repos/open-context"),
        "main".to_string(),
    );
    db.create_git_repository(&repo)?;

    // 更新同步状态
    db.update_git_repository_sync(&repo.id, "abc123def456")?;

    // 列出所有仓库
    let repos = db.list_git_repositories(&workspace_id)?;
    for repo in repos {
        println!("仓库: {} (分支: {})", repo.name, repo.branch);
        if let Some(hash) = repo.last_commit_hash {
            println!("  最后提交: {}", hash);
        }
    }

    Ok(())
}
```

### 6. 网页链接管理

```rust
use open_context_lib::{AppState, WebLink};

fn web_link_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();
    let workspace_id = "workspace-id".to_string();

    // 添加网页链接
    let mut link = WebLink::new(
        workspace_id.clone(),
        "Rust 官方文档".to_string(),
        "https://doc.rust-lang.org/".to_string(),
    );
    link.description = Some("Rust 编程语言官方文档".to_string());
    link.tags = vec!["rust".to_string(), "docs".to_string()];
    db.create_web_link(&link)?;

    // 列出所有链接
    let links = db.list_web_links(&workspace_id)?;
    for link in links {
        println!("- {}: {}", link.title, link.url);
    }

    // 搜索链接
    let rust_links = db.search_web_links(&workspace_id, "rust")?;
    println!("找到 {} 个 Rust 相关链接", rust_links.len());

    Ok(())
}
```

### 7. 完整工作流示例

```rust
use open_context_lib::{AppState, Workspace, Note, NoteType};
use std::path::PathBuf;

fn complete_workflow_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();

    // 1. 创建工作空间
    let workspace = Workspace::new(
        "2024 产品开发".to_string(),
        Some("新产品开发项目".to_string())
    );
    db.create_workspace(&workspace)?;
    db.set_active_workspace(&workspace.id)?;

    // 2. 创建项目笔记
    let design_note = Note::new(
        workspace.id.clone(),
        "产品设计文档".to_string(),
        NoteType::Markdown,
        "# 产品设计\n\n## 核心功能\n- 用户管理\n- 数据分析".to_string(),
        PathBuf::from("/workspaces/notes/design.md")
    );
    db.create_note(&design_note)?;
    db.add_note_tag(&design_note.id, "设计")?;

    // 3. 导入资源
    let spec_file = open_context_lib::ImportedFile::new(
        workspace.id.clone(),
        "产品规格书.pdf".to_string(),
        PathBuf::from("/original/spec.pdf"),
        PathBuf::from("/workspaces/files/spec.pdf"),
        "pdf".to_string(),
        1_500_000,
    );
    db.create_imported_file(&spec_file)?;

    // 4. 添加代码仓库
    let repo = open_context_lib::GitRepository::new(
        workspace.id.clone(),
        "product-backend".to_string(),
        "https://github.com/company/product-backend.git".to_string(),
        PathBuf::from("/workspaces/repos/product-backend"),
        "develop".to_string(),
    );
    db.create_git_repository(&repo)?;

    // 5. 收藏参考链接
    let reference = open_context_lib::WebLink::new(
        workspace.id.clone(),
        "竞品分析".to_string(),
        "https://example.com/competitor-analysis".to_string(),
    );
    db.create_web_link(&reference)?;

    // 6. 统计工作空间资源
    let counts = db.count_workspace_resources(&workspace.id)?;
    println!("工作空间 '{}' 资源统计:", workspace.name);
    println!("  笔记: {}", counts.notes);
    println!("  文件: {}", counts.files);
    println!("  仓库: {}", counts.repositories);
    println!("  链接: {}", counts.links);

    // 7. 检查存储使用
    let storage = db.get_workspace_storage_stats(&workspace.id)?;
    let mb = storage.total_size_bytes as f64 / 1_048_576.0;
    println!("  存储: {:.2} MB", mb);

    Ok(())
}
```

## 数据库位置

所有数据存储在配置目录下：

- **数据库文件**：`~/.config/open-context/app_state.db`
- **工作空间数据**：`~/.config/open-context/workspaces/`

可以通过环境变量 `OPEN_CONTEXT_CONFIG_DIR` 自定义配置目录。

## 线程安全

`AppState` 和 `DatabaseManager` 都是线程安全的，可以在多线程环境中安全使用：

```rust
use std::sync::Arc;
use std::thread;

fn multi_threaded_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = Arc::new(AppState::new()?);

    let mut handles = vec![];

    for i in 0..5 {
        let state = Arc::clone(&app_state);
        let handle = thread::spawn(move || {
            let workspace = Workspace::new(
                format!("工作空间 {}", i),
                None
            );
            state.db().create_workspace(&workspace).unwrap();
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let workspaces = app_state.db().list_workspaces()?;
    println!("创建了 {} 个工作空间", workspaces.len());

    Ok(())
}
```

## 错误处理

所有操作返回 `Result` 类型，可以使用 `?` 操作符进行错误传播：

```rust
fn error_handling_example() -> Result<(), Box<dyn std::error::Error>> {
    let app_state = AppState::new()?;
    let db = app_state.db();

    // 使用 ? 操作符自动传播错误
    let workspace = Workspace::new("测试".to_string(), None);
    db.create_workspace(&workspace)?;

    // 手动处理错误
    match db.get_workspace(&workspace.id) {
        Ok(Some(ws)) => println!("找到工作空间: {}", ws.name),
        Ok(None) => println!("工作空间不存在"),
        Err(e) => eprintln!("数据库错误: {}", e),
    }

    Ok(())
}
```

## 最佳实践

1. **单例模式**：在应用中创建一个 `AppState` 实例并共享
2. **活跃工作空间**：始终设置一个活跃工作空间，简化操作
3. **资源清理**：删除工作空间时，关联的资源会自动级联删除（`ON DELETE CASCADE`）
4. **批量操作**：尽量使用事务处理批量操作（未来版本支持）
5. **搜索优化**：数据库已创建索引，查询性能较好

## 测试

所有功能都有完整的单元测试，可以运行：

```bash
cargo test --lib
```

## 进一步开发

- [ ] 添加事务支持
- [ ] 实现数据导出/导入功能
- [ ] 添加全文搜索索引
- [ ] 支持数据加密
- [ ] 实现数据备份和恢复
