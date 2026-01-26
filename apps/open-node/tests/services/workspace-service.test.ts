import { describe, it, expect, beforeEach } from 'vitest';
import { WorkspaceService } from '../../src/services/workspace-service';

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  let testWorkspaceId: string;

  beforeEach(async () => {
    workspaceService = new WorkspaceService();
    // 创建测试用 workspace
    const workspace = await workspaceService.createWorkspace({
      name: 'test-workspace-for-crud'
    });
    testWorkspaceId = workspace.id;
  });

  describe('createWorkspace', () => {
    it('should create a new workspace', async () => {
      const createDto = {
        name: 'test-workspace',
        description: 'Test workspace'
      };

      const result = await workspaceService.createWorkspace(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result.name).toBe('test-workspace');
    });

    it('should handle creation with minimal data', async () => {
      const createDto = {
        name: 'minimal-workspace'
      };

      const result = await workspaceService.createWorkspace(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('minimal-workspace');
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace by id', async () => {
      const result = await workspaceService.getWorkspace(testWorkspaceId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testWorkspaceId);
    });

    it('should return null for non-existent workspace', async () => {
      const result = await workspaceService.getWorkspace('non_existent_id');

      expect(result).toBeNull();
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace', async () => {
      const updateDto = {
        name: 'updated-workspace'
      };

      const result = await workspaceService.updateWorkspace(testWorkspaceId, updateDto);

      expect(result).toBeDefined();
      expect(result?.name).toBe('updated-workspace');
    });

    it('should return null for non-existent workspace', async () => {
      const updateDto = {
        name: 'updated-workspace'
      };

      const result = await workspaceService.updateWorkspace('non_existent_id', updateDto);

      expect(result).toBeNull();
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace', async () => {
      // 先创建一个专门用于删除测试的 workspace
      const workspace = await workspaceService.createWorkspace({
        name: 'workspace-to-delete'
      });

      const result = await workspaceService.deleteWorkspace(workspace.id);
      expect(result).toBe(true);

      // 验证删除后获取返回 null
      const deleted = await workspaceService.getWorkspace(workspace.id);
      expect(deleted).toBeNull();
    });

    it('should return false for non-existent workspace', async () => {
      const result = await workspaceService.deleteWorkspace('non_existent_id');

      expect(result).toBe(false);
    });
  });
});
