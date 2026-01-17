import { Hono } from 'hono';
import { JobService, RepoService } from '../services';
import { getJobQueueInstance } from '../jobs';
import { AppContext } from '../app';

const indexRoutes = new Hono<AppContext>();
const jobService = new JobService();
const repoService = new RepoService();

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

export default indexRoutes;
