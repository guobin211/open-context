import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestApp, createMockRepo, createMockJob } from '../helpers';
import indexRoutes from '../../src/api/index-routes';

vi.mock('../../src/services', () => ({
  JobService: vi.fn().mockImplementation(() => ({
    createJob: vi.fn(),
    getJob: vi.fn()
  })),
  RepoService: vi.fn().mockImplementation(() => ({
    getRepo: vi.fn()
  }))
}));

vi.mock('../../src/jobs', () => ({
  getJobQueueInstance: vi.fn().mockReturnValue({
    enqueue: vi.fn()
  })
}));

describe('Index API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', indexRoutes);
    vi.clearAllMocks();
  });

  describe('POST /api/v1/repos/:repoId/index', () => {
    it('should start indexing a repository', async () => {
      const mockRepo = createMockRepo();
      const mockJob = createMockJob();
      const { RepoService, JobService } = await import('../../src/services');
      const repoService = new RepoService();
      const jobService = new JobService();

      vi.mocked(repoService.getRepo).mockResolvedValue(mockRepo);
      vi.mocked(jobService.createJob).mockResolvedValue(mockJob);

      const res = await app.request('/api/v1/repos/repo_test_123/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('jobId');
      expect(data).toHaveProperty('status', 'queued');
    });

    it('should default to full mode if not specified', async () => {
      const mockRepo = createMockRepo();
      const mockJob = createMockJob();
      const { RepoService, JobService } = await import('../../src/services');
      const repoService = new RepoService();
      const jobService = new JobService();

      vi.mocked(repoService.getRepo).mockResolvedValue(mockRepo);
      vi.mocked(jobService.createJob).mockResolvedValue(mockJob);

      const res = await app.request('/api/v1/repos/repo_test_123/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('jobId');
    });

    it('should return 404 for non-existent repository', async () => {
      const { RepoService } = await import('../../src/services');
      const repoService = new RepoService();
      vi.mocked(repoService.getRepo).mockResolvedValue(null);

      const res = await app.request('/api/v1/repos/non_existent/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'Repository not found');
    });
  });

  describe('POST /api/v1/repos/:repoId/reindex', () => {
    it('should start reindexing a repository', async () => {
      const mockRepo = createMockRepo();
      const mockJob = createMockJob();
      const { RepoService, JobService } = await import('../../src/services');
      const repoService = new RepoService();
      const jobService = new JobService();

      vi.mocked(repoService.getRepo).mockResolvedValue(mockRepo);
      vi.mocked(jobService.createJob).mockResolvedValue(mockJob);

      const res = await app.request('/api/v1/repos/repo_test_123/reindex', {
        method: 'POST'
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('jobId');
    });

    it('should return 404 for non-existent repository', async () => {
      const { RepoService } = await import('../../src/services');
      const repoService = new RepoService();
      vi.mocked(repoService.getRepo).mockResolvedValue(null);

      const res = await app.request('/api/v1/repos/non_existent/reindex', {
        method: 'POST'
      });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/jobs/:jobId', () => {
    it('should return job status', async () => {
      const mockJob = createMockJob();
      const { JobService } = await import('../../src/services');
      const jobService = new JobService();
      vi.mocked(jobService.getJob).mockResolvedValue(mockJob);

      const res = await app.request('/api/v1/jobs/job_test_123');

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('jobId', mockJob.jobId);
      expect(data).toHaveProperty('status', mockJob.status);
    });

    it('should return 404 for non-existent job', async () => {
      const { JobService } = await import('../../src/services');
      const jobService = new JobService();
      vi.mocked(jobService.getJob).mockResolvedValue(null);

      const res = await app.request('/api/v1/jobs/non_existent');

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty('error', 'Job not found');
    });
  });
});
