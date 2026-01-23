# Services 层文档

本服务层实现了策略模式，支持 Tauri 和 HTTP 两种数据管理方式。

## 📁 目录结构

```
services/
├── types.ts           # 类型定义和接口
├── tauri-services.ts  # Tauri 实现
├── http-services.ts    # HTTP 实现
├── index.ts          # 工厂模式和导出
└── README.md         # 本文档
```

## 🎯 架构设计

### 策略模式

使用策略模式实现两种数据提供者：

1. **Tauri Provider**: 通过 Tauri 命令与 Rust 后端通信
2. **HTTP Provider**: 通过 fetch API 与 Node.js 后端通信

### 核心组件

#### 1. 类型定义 (`types.ts`)

定义所有数据模型和服务接口：

```typescript
// 数据模型
export interface Workspace { ... }
export interface Note { ... }
export interface FileResource { ... }
export interface Repository { ... }

// 服务接口
export interface IWorkspaceService { ... }
export interface INoteService { ... }
export interface IFileService { ... }
export interface IRepositoryServiceRepository { ... }

// 数据提供者接口
export interface IDataProvider {
  workspace: IWorkspaceService;
  note: INoteService;
  file: IFileService;
  repository: IRepositoryServiceRepository;
}
```

#### 2. Tauri 实现 (`tauri-services.ts`)

通过 Tauri 命令调用 Rust 后端：

```typescript
class TauriWorkspaceService implements IWorkspaceService {
  async getAll(): Promise<Workspace[]> {
    return await invoke<Workspace[]>('get_all_workspaces');
  }

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    return await invoke<Workspace>('create_workspace', { dto });
  }

  // ... 其他方法
}
```

#### 3. HTTP 实现 (`http-services.ts`)

通过 fetch API 调用 Node.js 后端：

```typescript
class HttpWorkspaceService implements IWorkspaceService {
  private client: HttpClient;

  async getAll(): Promise<Workspace[]> {
    return this.client.get<Workspace[]>('/api/v1/workspaces');
  }

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const response = await this.client.post<ApiResponse<Workspace>>('/api/v1/workspaces', dto);
    return response.data;
  }

  // ... 其他方法
}
```

#### 4. 工厂模式 (`index.ts`)

`DataProviderFactory` 管理数据提供者的创建和切换：

```typescript
class DataProviderFactory {
  // 创建数据提供者
  static create(config: DataProviderConfig): IDataProvider {
    switch (config.type) {
      case 'tauri':
        return tauriServices;
      case 'http':
        return createHttpServices(config.baseUrl);
    }
  }

  // 获取或创建默认数据提供者（Tauri）
  static getOrCreateDefault(): IDataProvider { ... }

  // 设置全局数据提供者
  static setGlobal(config: DataProviderConfig): void { ... }
}
```

## 🚀 使用方法

### 方法 1: 使用默认数据提供者（推荐）

```typescript
import { DataProviderFactory } from '@/services';

// 获取默认数据提供者（自动使用 Tauri）
const services = DataProviderFactory.getOrCreateDefault();

// 使用服务
const workspaces = await services.workspace.getAll();
const notes = await services.note.getAll();
const files = await services.file.getAll();
const repos = await services.repository.getAll('workspace-id');
```

### 方法 2: 使用 HTTP 数据提供者

```typescript
import { DataProviderFactory } from '@/services';

// 切换到 HTTP 提供者
DataProviderFactory.setGlobal({
  type: 'http',
  baseUrl: 'http://localhost:4500'
});

const services = DataProviderFactory.getOrCreateDefault();
const workspaces = await services.workspace.getAll();
```

### 方法 3: 在 React 组件中使用

```typescript
import { useWorkspaceService, useNoteService } from '@/services';

function MyComponent() {
  const workspaceService = useWorkspaceService();
  const noteService = useNoteService();

  const fetchWorkspaces = async () => {
    try {
      const workspaces = await workspaceService.getAll();
      console.log('Workspaces:', workspaces);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return <div>...</div>;
}
```

## 📋 服务 API

### 工作空间服务 (IWorkspaceService)

| 方法              | 参数                             | 返回值                       | 描述                 |
| ----------------- | -------------------------------- | ---------------------------- | -------------------- |
| `getAll()`        | -                                | `Promise<Workspace[]>`       | 获取所有工作空间     |
| `getById(id)`     | `id: string`                     | `Promise<Workspace \| null>` | 根据 ID 获取工作空间 |
| `create(dto)`     | `CreateWorkspaceDto`             | `Promise<Workspace>`         | 创建工作空间         |
| `update(id, dto)` | `id: string, UpdateWorkspaceDto` | `Promise<Workspace \| null>` | 更新工作空间         |
| `delete(id)`      | `id: string`                     | `Promise<boolean>`           | 删除工作空间         |

### 笔记服务 (INoteService)

| 方法                | 参数                        | 返回值                  | 描述                         |
| ------------------- | --------------------------- | ----------------------- | ---------------------------- |
| `getAll(parentId?)` | `parentId?: string`         | `Promise<Note[]>`       | 获取所有笔记（可选父级过滤） |
| `getById(id)`       | `id: string`                | `Promise<Note \| null>` | 根据 ID 获取笔记             |
| `create(dto)`       | `CreateNoteDto`             | `Promise<Note>`         | 创建笔记                     |
| `update(id, dto)`   | `id: string, UpdateNoteDto` | `Promise<Note \| null>` | 更新笔记                     |
| `delete(id)`        | `id: string`                | `Promise<boolean>`      | 删除笔记                     |

### 文件服务 (IFileService)

| 方法                | 参数                        | 返回值                          | 描述                         |
| ------------------- | --------------------------- | ------------------------------- | ---------------------------- |
| `getAll(parentId?)` | `parentId?: string`         | `Promise<FileResource[]>`       | 获取所有文件（可选父级过滤） |
| `getById(id)`       | `id: string`                | `Promise<FileResource \| null>` | 根据 ID 获取文件             |
| `create(dto)`       | `CreateFileDto`             | `Promise<FileResource>`         | 创建文件/文件夹              |
| `update(id, dto)`   | `id: string, UpdateFileDto` | `Promise<FileResource \| null>` | 更新文件                     |
| `delete(id)`        | `id: string`                | `Promise<boolean>`              | 删除文件                     |

### 仓库服务 (IRepositoryServiceRepository)

| 方法                  | 参数                              | 返回值                        | 描述                   |
| --------------------- | --------------------------------- | ----------------------------- | ---------------------- |
| `getAll(workspaceId)` | `workspaceId: string`             | `Promise<Repository[]>`       | 获取工作空间的所有仓库 |
| `getById(id)`         | `id: string`                      | `Promise<Repository \| null>` | 根据 ID 获取仓库       |
| `create(dto)`         | `CreateRepositoryDto`             | `Promise<Repository>`         | 创建仓库               |
| `update(id, dto)`     | `id: string, UpdateRepositoryDto` | `Promise<Repository \| null>` | 更新仓库               |
| `delete(id)`          | `id: string`                      | `Promise<boolean>`            | 删除仓库               |

## 🔄 数据提供者切换

### 切换到 Tauri（默认）

```typescript
import { DataProviderFactory } from '@/services';

DataProviderFactory.setGlobal({ type: 'tauri' });
```

### 切换到 HTTP

```typescript
import { DataProviderFactory } from '@/services';

DataProviderFactory.setGlobal({
  type: 'http',
  baseUrl: 'http://localhost:4500'
});
```

### 环境变量配置

```typescript
import { DataProviderFactory } from '@/services';

const providerType = import.meta.env.VITE_DATA_PROVIDER || 'tauri';
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4500';

DataProviderFactory.setGlobal({
  type: providerType === 'http' ? 'http' : 'tauri',
  baseUrl
});
```

## 🔧 错误处理

所有服务方法都包含错误处理：

```typescript
try {
  const workspaces = await services.workspace.getAll();
  // 处理数据
} catch (error) {
  console.error('Error:', error);
  // 显示错误提示给用户
}
```

### Tauri 错误处理

- 捕获 Tauri 命令调用错误
- 记录错误到控制台
- 重新抛出错误供调用方处理

### HTTP 错误处理

- 捕获 fetch 错误
- 检查 HTTP 状态码
- 解析错误响应
- 记录错误到控制台

## 📚 数据模型

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
  type: 'rich-text' | 'markdown' | 'code';
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}
```

### FileResource

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

### Repository

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

## 🎯 最佳实践

1. **使用 Hooks**: 在 React 组件中使用提供的 Hooks
2. **错误处理**: 总是使用 try-catch 处理错误
3. **类型安全**: 利用 TypeScript 类型定义
4. **单一数据源**: 应用中只使用一个数据提供者实例
5. **环境配置**: 使用环境变量配置数据提供者类型

## 🔌 示例

### 完整的 CRUD 示例

```typescript
import { useWorkspaceService } from '@/services';

function WorkspaceManager() {
  const workspaceService = useWorkspaceService();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

  // 查询所有工作空间
  const fetchWorkspaces = async () => {
    try {
      const data = await workspaceService.getAll();
      setWorkspaces(data);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
      showToast('加载工作空间失败', 'error');
    }
  };

  // 创建工作空间
  const createWorkspace = async (name: string) => {
    try {
      const workspace = await workspaceService.create({ name });
      setWorkspaces([...workspaces, workspace]);
      showToast('工作空间创建成功', 'success');
    } catch (error) {
      console.error('Failed to create workspace:', error);
      showToast('创建工作空间失败', 'error');
    }
  };

  // 更新工作空间
  const updateWorkspace = async (id: string, name: string) => {
    try {
      const updated = await workspaceService.update(id, { name });
      if (updated) {
        setWorkspaces(workspaces.map(w => w.id === id ? updated : w));
        showToast('工作空间更新成功', 'success');
      }
    } catch (error) {
      console.error('Failed to update workspace:', error);
      showToast('更新工作空间失败', 'error');
    }
  };

  // 删除工作空间
  const deleteWorkspace = async (id: string) => {
    try {
      const success = await workspaceService.delete(id);
      if (success) {
        setWorkspaces(workspaces.filter(w => w.id !== id));
        showToast('工作空间删除成功', 'success');
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      showToast('删除工作空间失败', 'error');
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return (
    <div>
      <button onClick={() => createWorkspace('新工作空间')}>
        创建工作空间
      </button>
      {workspaces.map(workspace => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          onUpdate={updateWorkspace}
          onDelete={deleteWorkspace}
        />
      ))}
    </div>
  );
}
```

## ✅ 优势

1. **策略模式**: 轻松切换数据提供者
2. **类型安全**: 完整的 TypeScript 类型支持
3. **统一接口**: 两种实现使用相同的接口
4. **错误处理**: 统一的错误处理机制
5. **易于测试**: 可以轻松 mock 服务进行测试
6. **可扩展**: 易于添加新的数据提供者实现
