import { Hono } from 'hono';
import { JobService, RepoService, RAGService } from '../services';
import { getJobQueueInstance } from '../jobs';
import { CommonIndexer } from '../indexers/common-indexer';
import { AppContext } from '../app';
import logger from '../utils/logger';

const indexRoutes = new Hono<AppContext>();
const jobService = new JobService();
const repoService = new RepoService();
const indexer = new CommonIndexer();
indexRoutes.post('/repos/:repoId/index', async (c) => {
  const repoId = c.req.param('repoId');
  const repo = await repoService.getRepo(repoId);
  if (!repo) {
    return c.json({ error: 'Repository not found' }, 404);
  }

  const body = await c.req.json<{ mode?: 'full' | 'incremental' }>();
  const mode = body.mode || 'full';
  const job = await jobService.createJob(repoId, mode);

  const graphService = c.get('graphService');
  const jobQueue = getJobQueueInstance(graphService);

  jobQueue.enqueue({
    jobId: job.jobId,
    repoId,
    workspaceId: repo.workspaceId,
    mode
  });

  return c.json({ jobId: job.jobId, status: 'queued' });
});

indexRoutes.post('/repos/:repoId/reindex', async (c) => {
  const repoId = c.req.param('repoId');
  const repo = await repoService.getRepo(repoId);
  if (!repo) {
    return c.json({ error: 'Repository not found' }, 404);
  }

  const job = await jobService.createJob(repoId, 'incremental');

  const graphService = c.get('graphService');
  const jobQueue = getJobQueueInstance(graphService);

  jobQueue.enqueue({
    jobId: job.jobId,
    repoId,
    workspaceId: repo.workspaceId,
    mode: 'incremental'
  });

  return c.json({ jobId: job.jobId });
});

indexRoutes.get('/jobs/:jobId', async (c) => {
  const jobId = c.req.param('jobId');
  const job = await jobService.getJob(jobId);
  if (!job) {
    return c.json({ error: 'Job not found' }, 404);
  }
  return c.json(job);
});

/**
 * POST /api/v1/index/file
 * 索引单个文件
 */
indexRoutes.post('/file', async (c) => {
  try {
    const body = await c.req.json();
    const { filePath, content, metadata } = body;

    if (!filePath || !content) {
      return c.json({ error: 'Missing required fields: filePath, content' }, 400);
    }

    const result = await indexer.indexFile({ filePath, content, metadata });

    return c.json({
      success: true,
      chunks: result.chunks.length,
      edges: result.edges.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to index file');
    return c.json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/index/content
 * 索引代码片段
 */
indexRoutes.post('/content', async (c) => {
  try {
    const body = await c.req.json();
    const { content, language, metadata } = body;

    if (!content || !language) {
      return c.json({ error: 'Missing required fields: content, language' }, 400);
    }

    const result = await indexer.indexContent({ content, language, metadata });

    return c.json({
      success: true,
      chunks: result.chunks.length,
      edges: result.edges.length
    });
  } catch (error) {
    logger.error({ error }, 'Failed to index content');
    return c.json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/index/repo
 * 索引 Git 仓库
 */
indexRoutes.post('/repo', async (c) => {
  try {
    const body = await c.req.json();
    const { repoPath, repoId, workspaceId, repoName } = body;

    if (!repoPath || !repoId) {
      return c.json({ error: 'Missing required fields: repoPath, repoId' }, 400);
    }

    const result = await indexer.indexGitRepo({
      repoPath,
      repoId,
      workspaceId,
      repoName
    });

    return c.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error({ error }, 'Failed to index repository');
    return c.json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

/**
 * POST /api/v1/query/hybrid
 * 混合查询（向量 + 全文 + 图）
 */
indexRoutes.post('/query/hybrid', async (c) => {
  try {
    const body = await c.req.json();
    const { query, workspaceId, weights, topK = 10, filters } = body;

    if (!query || !workspaceId) {
      return c.json({ error: 'Missing required fields: query, workspaceId' }, 400);
    }

    // 验证权重
    if (weights) {
      const { vector = 0, fulltext = 0, graph = 0 } = weights;
      if (vector < 0 || fulltext < 0 || graph < 0 || vector + fulltext + graph === 0) {
        return c.json({ error: 'Invalid weights: all values must be non-negative and sum > 0' }, 400);
      }
    }

    const graphService = c.get('graphService');
    const ragService = new RAGService(graphService);

    const results = await ragService.hybridSearch({
      query,
      workspaceId,
      topK,
      filters,
      weights
    });

    return c.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    logger.error({ error }, 'Failed to perform hybrid search');
    return c.json({ error: error instanceof Error ? error.message : 'Internal server error' }, 500);
  }
});

export default indexRoutes;
