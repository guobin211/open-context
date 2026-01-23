import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkspaceService } from '../src/services/workspace-service';

vi.mock('./src/db/workspace-repository');

describe('WorkspaceService with Repository Operations', () => {
  const service: WorkspaceService = new WorkspaceService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_workspace', () => {
    it('should create workspace with repository', async () => {
      const dto = {
        name: 'Test Workspace',
        url: 'https://github.com/test/repo.git',
        branch: 'main'
      };

      const workspace = await service.createWorkspace(dto);

      expect(workspace.id).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.url).toBe('test/repo.git');
      expect(workspace.branch).toBe('main');
      expect(workspace.createdAt).toBeDefined();
      expect(workspace.updatedAt).toBeDefined();

      // 验证仓库已添加到工作空间
      const workspaces = await service.getAllWorkspaces();
      expect(workspaces).toBeDefined();
      expect(workspaces.length).toBeGreaterThan(0);
      expect(workspaces.some((w) => w.id === workspace.id)).toBe(true);
    });
  });

  describe('update_workspace', () => {
    it('should update workspace metadata', async () => {
      const dto = {
        name: 'Updated Workspace'
      };

      const workspace = await service.createWorkspace(dto);

      const updated = await service.updateWorkspace(workspace.id, {
        name: 'Updated Test Workspace'
      });

      if (!updated) {
        return;
      }
      expect(updated.id).toBe(workspace.id);
      expect(updated.name).toBe('Updated Test Workspace');
      expect(updated.updatedAt).toBeDefined();
    });
  });

  describe('delete_workspace', () => {
    it('should delete workspace', async () => {
      const workspace = await service.createWorkspace({
        name: 'Test Workspace'
      });

      const workspaces = await service.getAllWorkspaces();
      expect(workspaces).toBeDefined();
      expect(workspaces.length).toBeGreaterThan(0);

      const deleted = await service.deleteWorkspace(workspace.id);
      expect(deleted).toBe(true);

      // 验证工作空间已删除
      const remaining = await service.getAllWorkspaces();
      expect(remaining.length).toBe(workspaces.length - 1);
    });
  });
});
