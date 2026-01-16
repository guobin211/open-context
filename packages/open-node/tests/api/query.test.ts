import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp } from '../helpers';
import queryRoutes from '../../src/api/query-routes';

vi.mock('../../src/services', () => ({
  RAGService: vi.fn().mockImplementation(() => ({
    query: vi.fn()
  }))
}));

describe('Query API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', queryRoutes);
    vi.clearAllMocks();
  });

  describe('POST /api/v1/query/vector', () => {
    it('should perform vector search', async () => {
      const mockResults = [
        {
          symbolId: 'symbol_test_123',
          score: 0.87,
          code: 'function test() {}',
          file: 'src/test.ts',
          repo: 'test-repo',
          kind: 'function' as const
        }
      ];

      const { RAGService } = await import('../../src/services');
      const ragService = new RAGService({} as any);
      vi.mocked(ragService.query).mockResolvedValue(mockResults);

      const res = await app.request('/api/v1/query/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_test_123',
          query: 'verify jwt token',
          topK: 10
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('matches');
      expect(Array.isArray(data.matches)).toBe(true);
    });

    it('should handle query with filters', async () => {
      const mockResults: any[] = [];
      const { RAGService } = await import('../../src/services');
      const ragService = new RAGService({} as any);
      vi.mocked(ragService.query).mockResolvedValue(mockResults);

      const res = await app.request('/api/v1/query/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_test_123',
          query: 'authentication',
          topK: 5,
          filters: {
            repoIds: ['repo_test_123']
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('matches');
    });

    it('should validate required fields', async () => {
      const res = await app.request('/api/v1/query/vector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/query/code', () => {
    it('should perform code search with graph expansion', async () => {
      const mockResults = [
        {
          symbolId: 'symbol_test_123',
          score: 0.92,
          code: 'function verifyToken() {}',
          file: 'src/auth.ts',
          repo: 'auth-service',
          kind: 'function' as const
        }
      ];

      const { RAGService } = await import('../../src/services');
      const ragService = new RAGService({} as any);
      vi.mocked(ragService.query).mockResolvedValue(mockResults);

      const res = await app.request('/api/v1/query/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_test_123',
          query: 'where is token verified',
          expandGraph: {
            type: 'CALLS',
            depth: 1
          }
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('matches');
      expect(Array.isArray(data.matches)).toBe(true);
    });

    it('should handle query without graph expansion', async () => {
      const mockResults: any[] = [];
      const { RAGService } = await import('../../src/services');
      const ragService = new RAGService({} as any);
      vi.mocked(ragService.query).mockResolvedValue(mockResults);

      const res = await app.request('/api/v1/query/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: 'ws_test_123',
          query: 'authentication'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('matches');
    });
  });
});
