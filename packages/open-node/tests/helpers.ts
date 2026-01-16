import { Hono } from 'hono';
import { vi } from 'vitest';
import { AppContext } from '../src/app';
import { GraphService } from '../src/services';

export function createTestApp(): Hono<AppContext> {
  const app = new Hono<AppContext>();

  const mockGraphService = {
    init: vi.fn().mockResolvedValue(undefined),
    getDependencies: vi.fn().mockReturnValue({ from: 'test', edges: [] }),
    getReverseDependencies: vi.fn().mockReturnValue({ from: 'test', edges: [] }),
    traverse: vi.fn().mockReturnValue({ nodes: [], edges: [] }),
    addNode: vi.fn(),
    addEdge: vi.fn(),
    removeNode: vi.fn(),
    removeEdge: vi.fn()
  } as unknown as GraphService;

  app.use('*', async (c, next) => {
    c.set('graphService', mockGraphService);
    await next();
  });

  return app;
}

export function createMockWorkspace() {
  return {
    id: 'ws_test_123',
    name: 'test-workspace',
    description: 'Test workspace',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function createMockRepo() {
  return {
    id: 'repo_test_123',
    workspaceId: 'ws_test_123',
    name: 'test-repo',
    url: 'https://github.com/test/repo.git',
    defaultBranch: 'main',
    languageStats: { typescript: 100 },
    lastIndexedCommit: '',
    indexedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function createMockJob() {
  return {
    jobId: 'job_test_123',
    status: 'queued' as const,
    progress: 0
  };
}

export function createMockSymbol() {
  return {
    id: 'symbol_test_123',
    name: 'testFunction',
    type: 'function' as const,
    file: 'src/test.ts',
    line: 10,
    repoId: 'repo_test_123'
  };
}
