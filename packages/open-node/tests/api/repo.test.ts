import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp, createMockRepo } from '../helpers';
import repoRoutes from '../../src/api/repo-routes';

vi.mock('../../src/services', () => ({
  RepoService: vi.fn().mockImplementation(() => ({
    createRepo: vi.fn(),
    getRepo: vi.fn(),
    updateRepo: vi.fn(),
    deleteRepo: vi.fn()
  }))
}));

describe('Repository API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', repoRoutes);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/workspaces/:workspaceId/repos', () => {
    it('should return empty list', async () => {
      const res = await app.request('/api/v1/workspaces/ws_test_123/repos');
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ items: [] });
    });
  });

  describe('POST /api/v1/workspaces/:workspaceId/repos', () => {
    it('should create a new repository', async () => {
      const mockRepo = createMockRepo();
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.createRepo).mockResolvedValue(mockRepo);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-repo',
          gitUrl: 'https://github.com/test/repo.git',
          branch: 'main'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/v1/workspaces/ws_test_123/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/workspaces/:workspaceId/repos/:repoId', () => {
    it('should return repository by id', async () => {
      const mockRepo = createMockRepo();
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.getRepo).mockResolvedValue(mockRepo);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/repo_test_123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id', mockRepo.id);
      expect(data).toHaveProperty('name', mockRepo.name);
    });

    it('should return 404 for non-existent repository', async () => {
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.getRepo).mockResolvedValue(null);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/non_existent');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'Repository not found');
    });
  });

  describe('PUT /api/v1/workspaces/:workspaceId/repos/:repoId', () => {
    it('should update repository', async () => {
      const mockRepo = createMockRepo();
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.updateRepo).mockResolvedValue(mockRepo);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/repo_test_123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: 'develop' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('id');
    });

    it('should return 404 for non-existent repository', async () => {
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.updateRepo).mockResolvedValue(null);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/non_existent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: 'develop' })
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/workspaces/:workspaceId/repos/:repoId', () => {
    it('should delete repository', async () => {
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.deleteRepo).mockResolvedValue(true);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/repo_test_123', {
        method: 'DELETE'
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toEqual({ status: 'deleted' });
    });

    it('should return 404 for non-existent repository', async () => {
      const { RepoService } = await import('../../src/services');
      const mockInstance = new RepoService();
      vi.mocked(mockInstance.deleteRepo).mockResolvedValue(false);

      const res = await app.request('/api/v1/workspaces/ws_test_123/repos/non_existent', {
        method: 'DELETE'
      });

      expect(res.status).toBe(404);
    });
  });
});
