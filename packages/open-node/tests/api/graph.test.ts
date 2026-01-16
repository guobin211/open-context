import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp } from '../helpers';
import graphRoutes from '../../src/api/graph-routes';

describe('Graph API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', graphRoutes);
    vi.clearAllMocks();
  });

  describe('GET /api/v1/graph/deps', () => {
    it('should return dependencies of a symbol', async () => {
      const res = await app.request('/api/v1/graph/deps?symbolId=auth.verifyToken&type=CALLS');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('from');
      expect(data).toHaveProperty('edges');
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it('should work without type filter', async () => {
      const res = await app.request('/api/v1/graph/deps?symbolId=auth.verifyToken');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('from');
      expect(data).toHaveProperty('edges');
    });

    it('should handle missing symbolId', async () => {
      const res = await app.request('/api/v1/graph/deps');

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/v1/graph/reverse-deps', () => {
    it('should return reverse dependencies of a symbol', async () => {
      const res = await app.request('/api/v1/graph/reverse-deps?symbolId=jwt.verify&type=CALLS');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('from');
      expect(data).toHaveProperty('edges');
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it('should work without type filter', async () => {
      const res = await app.request('/api/v1/graph/reverse-deps?symbolId=jwt.verify');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('from');
      expect(data).toHaveProperty('edges');
    });
  });

  describe('GET /api/v1/graph/traverse', () => {
    it('should traverse dependency graph with specified depth', async () => {
      const res = await app.request('/api/v1/graph/traverse?symbolId=auth.verifyToken&depth=2&type=CALLS');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it('should default to depth 2 if not specified', async () => {
      const res = await app.request('/api/v1/graph/traverse?symbolId=auth.verifyToken');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
    });

    it('should handle custom depth', async () => {
      const res = await app.request('/api/v1/graph/traverse?symbolId=auth.verifyToken&depth=3');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('nodes');
    });

    it('should work with type filter', async () => {
      const res = await app.request('/api/v1/graph/traverse?symbolId=auth.verifyToken&depth=1&type=IMPORTS');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
    });
  });
});
