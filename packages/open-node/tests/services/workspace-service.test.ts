import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from '../../src/services/workspace-service';
import { createMockWorkspace } from '../helpers';

vi.mock('../../src/db/workspace-repository', () => ({
  WorkspaceRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAll: vi.fn()
  }))
}));

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;

  beforeEach(() => {
    workspaceService = new WorkspaceService();
    vi.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a new workspace', async () => {
      const mockWorkspace = createMockWorkspace();
      const createDto = {
        name: 'test-workspace',
        description: 'Test workspace'
      };

      const result = await workspaceService.createWorkspace(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
    });

    it('should handle creation with minimal data', async () => {
      const createDto = {
        name: 'minimal-workspace'
      };

      const result = await workspaceService.createWorkspace(createDto);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace by id', async () => {
      const mockWorkspace = createMockWorkspace();

      const result = await workspaceService.getWorkspace('ws_test_123');

      expect(result).toBeDefined();
    });

    it('should return null for non-existent workspace', async () => {
      const result = await workspaceService.getWorkspace('non_existent');

      expect(result).toBeNull();
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace', async () => {
      const mockWorkspace = createMockWorkspace();
      const updateDto = {
        name: 'updated-workspace'
      };

      const result = await workspaceService.updateWorkspace('ws_test_123', updateDto);

      expect(result).toBeDefined();
    });

    it('should return null for non-existent workspace', async () => {
      const updateDto = {
        name: 'updated-workspace'
      };

      const result = await workspaceService.updateWorkspace('non_existent', updateDto);

      expect(result).toBeNull();
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace', async () => {
      const result = await workspaceService.deleteWorkspace('ws_test_123');

      expect(result).toBe(true);
    });

    it('should return false for non-existent workspace', async () => {
      const result = await workspaceService.deleteWorkspace('non_existent');

      expect(result).toBe(false);
    });
  });
});
