// ==================== 通用类型定义 ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// ==================== 工作空间类型 ====================

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

// ==================== 笔记类型 ====================

export interface Note {
  id: string;
  title: string;
  content?: string;
  type: 'rich-text' | 'markdown' | 'code';
  parentId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateNoteDto {
  title: string;
  content?: string;
  type?: Note['type'];
  parentId?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  type?: Note['type'];
}

// ==================== 文件类型 ====================

export interface FileResource {
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

export interface CreateFileDto {
  name: string;
  path: string;
  type?: FileResource['type'];
  parentId?: string;
}

export interface UpdateFileDto {
  name?: string;
  path?: string;
}

// ==================== 仓库类型 ====================

export interface Repository {
  id: string;
  name: string;
  url: string;
  branch?: string;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateRepositoryDto {
  name: string;
  url: string;
  branch?: string;
  workspaceId: string;
}

export interface UpdateRepositoryDto {
  name?: string;
  url?: string;
  branch?: string;
}

// ==================== 服务接口定义 ====================

export interface IWorkspaceService {
  getAll(): Promise<Workspace[]>;
  getById(id: string): Promise<Workspace | null>;
  create(dto: CreateWorkspaceDto): Promise<Workspace>;
  update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace | null>;
  delete(id: string): Promise<boolean>;
}

export interface INoteService {
  getAll(parentId?: string): Promise<Note[]>;
  getById(id: string): Promise<Note | null>;
  create(dto: CreateNoteDto): Promise<Note>;
  update(id: string, dto: UpdateNoteDto): Promise<Note | null>;
  delete(id: string): Promise<boolean>;
}

export interface IFileService {
  getAll(parentId?: string): Promise<FileResource[]>;
  getById(id: string): Promise<FileResource | null>;
  create(dto: CreateFileDto): Promise<FileResource>;
  update(id: string, dto: UpdateFileDto): Promise<FileResource | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRepositoryService {
  getAll(workspaceId: string): Promise<Repository[]>;
  getById(id: string): Promise<Repository | null>;
  create(dto: CreateRepositoryDto): Promise<Repository>;
  update(id: string, dto: UpdateRepositoryDto): Promise<Repository | null>;
  delete(id: string): Promise<boolean>;
}

// ==================== 数据提供者接口 ====================

export interface IDataProvider {
  workspace: IWorkspaceService;
  note: INoteService;
  file: IFileService;
  repository: IRepositoryService;
}

// ==================== 配置类型 ====================

export type DataProviderType = 'tauri' | 'http';

export interface DataProviderConfig {
  type: DataProviderType;
  baseUrl?: string;
}
