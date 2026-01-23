import { invoke } from '@tauri-apps/api/core';
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
  IWorkspaceService,
  INoteService,
  IFileService,
  IRepositoryService
} from './types';

// ==================== Tauri 工作空间服务 ====================

class TauriWorkspaceService implements IWorkspaceService {
  async getAll(): Promise<Workspace[]> {
    try {
      return await invoke<Workspace[]>('get_all_workspaces');
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Workspace | null> {
    try {
      return await invoke<Workspace>('get_workspace', { id });
    } catch (error) {
      console.error(`Error fetching workspace ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    try {
      return await invoke<Workspace>('create_workspace', { dto });
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace | null> {
    try {
      return await invoke<Workspace>('update_workspace', { id, dto });
    } catch (error) {
      console.error(`Error updating workspace ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_workspace', { id });
    } catch (error) {
      console.error(`Error deleting workspace ${id}:`, error);
      return false;
    }
  }
}

// ==================== Tauri 笔记服务 ====================

class TauriNoteService implements INoteService {
  async getAll(parentId?: string): Promise<Note[]> {
    try {
      return await invoke<Note[]>('get_all_notes', { parentId });
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Note | null> {
    try {
      return await invoke<Note>('get_note', { id });
    } catch (error) {
      console.error(`Error fetching note ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateNoteDto): Promise<Note> {
    try {
      return await invoke<Note>('create_note', { dto });
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateNoteDto): Promise<Note | null> {
    try {
      return await invoke<Note>('update_note', { id, dto });
    } catch (error) {
      console.error(`Error updating note ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_note', { id });
    } catch (error) {
      console.error(`Error deleting note ${id}:`, error);
      return false;
    }
  }
}

// ==================== Tauri 文件服务 ====================

class TauriFileService implements IFileService {
  async getAll(parentId?: string): Promise<FileResource[]> {
    try {
      return await invoke<FileResource[]>('get_all_files', { parentId });
    } catch (error) {
      console.error('Error fetching files:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<FileResource | null> {
    try {
      return await invoke<FileResource>('get_file', { id });
    } catch (error) {
      console.error(`Error fetching file ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateFileDto): Promise<FileResource> {
    try {
      return await invoke<FileResource>('create_file', { dto });
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateFileDto): Promise<FileResource | null> {
    try {
      return await invoke<FileResource>('update_file', { id, dto });
    } catch (error) {
      console.error(`Error updating file ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_file', { id });
    } catch (error) {
      console.error(`Error deleting file ${id}:`, error);
      return false;
    }
  }
}

// ==================== Tauri 仓库服务 ====================

class TauriRepositoryService implements IRepositoryService {
  async getAll(workspaceId: string): Promise<Repository[]> {
    try {
      return await invoke<Repository[]>('get_all_repositories', { workspaceId });
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  async getById(id: string): Promise<Repository | null> {
    try {
      return await invoke<Repository>('get_repository', { id });
    } catch (error) {
      console.error(`Error fetching repository ${id}:`, error);
      return null;
    }
  }

  async create(dto: CreateRepositoryDto): Promise<Repository> {
    try {
      return await invoke<Repository>('create_repository', { dto });
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateRepositoryDto): Promise<Repository | null> {
    try {
      return await invoke<Repository>('update_repository', { id, dto });
    } catch (error) {
      console.error(`Error updating repository ${id}:`, error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      return await invoke<boolean>('delete_repository', { id });
    } catch (error) {
      console.error(`Error deleting repository ${id}:`, error);
      return false;
    }
  }
}

// ==================== 导出 Tauri 服务提供者 ====================

export const tauriServices = {
  workspace: new TauriWorkspaceService(),
  note: new TauriNoteService(),
  file: new TauriFileService(),
  repository: new TauriRepositoryService()
};
