import type {
  Workspace,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  FileResource,
  CreateFileDto,
  UpdateFileDto,
  Repository,
  CreateRepositoryDto,
  UpdateRepositoryDto,
  ApiResponse,
  IWorkspaceService,
  INoteService,
  IFileService,
  IRepositoryService
} from './types';

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:4500') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`HTTP request failed: ${url}`, error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// ==================== HTTP 工作空间服务 ====================

class HttpWorkspaceService implements IWorkspaceService {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async getAll(): Promise<Workspace[]> {
    return this.client.get<Workspace[]>('/api/v1/workspaces');
  }

  async getById(id: string): Promise<Workspace | null> {
    try {
      const response = await this.client.get<ApiResponse<Workspace>>(`/api/v1/workspaces/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching workspace ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const response = await this.client.post<ApiResponse<Workspace>>('/api/v1/workspaces', dto);
    return response.data;
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace | null> {
    try {
      const response = await this.client.put<ApiResponse<Workspace>>(`/api/v1/workspaces/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error(`Error updating workspace ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/workspaces/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting workspace ${id}:`, error);
      return false;
    }
  }
}

// ==================== HTTP 笔记服务 ====================

class HttpNoteService implements INoteService {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async getAll(parentId?: string): Promise<Note[]> {
    const endpoint = parentId ? `/api/v1/notes?parentId=${parentId}` : '/api/v1/notes';
    return this.client.get<Note[]>(endpoint);
  }

  async getById(id: string): Promise<Note | null> {
    try {
      const response = await this.client.get<ApiResponse<Note>>(`/api/v1/notes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching note ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    const response = await this.client.post<ApiResponse<Note>>('/api/v1/notes', dto);
    return response.data;
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note | null> {
    try {
      const response = await this.client.put<ApiResponse<Note>>(`/api/v1/notes/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/notes/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      return false;
    }
  }
}

// ==================== HTTP 文件服务 ====================

class HttpFileService implements IFileService {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async getAll(parentId?: string): Promise<FileResource[]> {
    const endpoint = parentId ? `/api/v1/files?parentId=${parentId}` : '/api/v1/files';
    return this.client.get<FileResource[]>(endpoint);
  }

  async getById(id: string): Promise<FileResource | null> {
    try {
      const response = await this.client.get<ApiResponse<FileResource>>(`/api/v1/files/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching file ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateFileDto): Promise<FileResource> {
    const response = await this.client.post<ApiResponse<FileResource>>('/api/v1/files', dto);
    return response.data;
  }

  async update(id: string, dto: UpdateFileDto): Promise<FileResource | null> {
    try {
      const response = await this.client.put<ApiResponse<FileResource>>(`/api/v1/files/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error(`Error updating file ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/files/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${id}:`, error);
      return false;
    }
  }
}

// ==================== HTTP 仓库服务 ====================

class HttpRepositoryService implements IRepositoryService {
  private client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async getAll(workspaceId: string): Promise<Repository[]> {
    return this.client.get<Repository[]>(`/api/v1/repositories?workspaceId=${workspaceId}`);
  }

  async getById(id: string): Promise<Repository | null> {
    try {
      const response = await this.client.get<ApiResponse<Repository>>(`/api/v1/repositories/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching repository ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateRepositoryDto): Promise<Repository> {
    const response = await this.client.post<ApiResponse<Repository>>('/api/v1/repositories', dto);
    return response.data;
  }

  async update(id: string, dto: UpdateRepositoryDto): Promise<Repository | null> {
    try {
      const response = await this.client.put<ApiResponse<Repository>>(`/api/v1/repositories/${id}`, dto);
      return response.data;
    } catch (error) {
      console.error(`Error updating repository ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.delete(`/api/v1/repositories/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting repository ${id}:`, error);
      return false;
    }
  }
}

// ==================== 导出 HTTP 服务提供者 ====================

export const createHttpServices = (baseUrl?: string) => {
  const client = new HttpClient(baseUrl);

  return {
    workspace: new HttpWorkspaceService(client),
    note: new HttpNoteService(client),
    file: new HttpFileService(client),
    repository: new HttpRepositoryService(client)
  };
};
