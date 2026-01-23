import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp, createMockWorkspace } from '../helpers';
import workspaceRoutes from '../../src/api/workspace-routes';

vi.mock('../../src/services', () => ({
  WorkspaceService: vi.fn().mockImplementation(() => ({
    createWorkspace: vi.fn(),
    getWorkspace: vi.fn(),
    updateWorkspace: vi.fn(),
    deleteWorkspace: vi.fn()
  }))
}));

describe('Workspace API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', workspaceRoutes);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/workspaces', () => {
    it('should return empty list', async () => {
      const res = await app.request('/api/v1/workspaces');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ items: [] });
    });
  });

  describe('POST /api/v1/workspaces', () => {
    it('should create a new workspace', async () => {
      const mockWorkspace = createMockWorkspace();
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.createWorkspace).mockResolvedValue(mockWorkspace);

      const res = await app.request('/api/v1/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-workspace',
          description: 'Test workspace'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
    });

    it('should handle invalid input', async () => {
      const res = await app.request('/api/v1/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId', () => {
    it('should return workspace by id', async () => {
      const mockWorkspace = createMockWorkspace();
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.getWorkspace).mockResolvedValue(mockWorkspace);

      const res = await app.request('/api/v1/workspaces/ws_test_123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id', mockWorkspace.id);
    });

    it('should return 404 for non-existent workspace', async () => {
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.getWorkspace).mockResolvedValue(null);

      const res = await app.request('/api/v1/workspaces/non_existent');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('PUT /api/v1/workspaces/:workspaceId', () => {
    it('should update workspace', async () => {
      const mockWorkspace = createMockWorkspace();
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.updateWorkspace).mockResolvedValue(mockWorkspace);

      const res = await app.request('/api/v1/workspaces/ws_test_123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated-workspace' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
    });

    it('should return 404 for non-existent workspace', async () => {
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.updateWorkspace).mockResolvedValue(null);

      const res = await app.request('/api/v1/workspaces/non_existent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' })
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/workspaces/:workspaceId', () => {
    it('should delete workspace', async () => {
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.deleteWorkspace).mockResolvedValue(true);

      const res = await app.request('/api/v1/workspaces/ws_test_123', {
        method: 'DELETE'
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: 'deleted' });
    });

    it('should return 404 for non-existent workspace', async () => {
      const { WorkspaceService } = await import('../../src/services');
      const mockInstance = new WorkspaceService();
      vi.mocked(mockInstance.deleteWorkspace).mockResolvedValue(false);

      const res = await app.request('/api/v1/workspaces/non_existent', {
        method: 'DELETE'
      });

      expect(res.status).toBe(404);
    });
  });
});
