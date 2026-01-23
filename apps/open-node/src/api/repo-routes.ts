import { Hono } from 'hono';
import { RepoService } from '../services';
import { CreateRepositoryDto, UpdateRepositoryDto } from '../types';
import { AppContext } from '../app';

const repoRoutes = new Hono<AppContext>();
const repoService = new RepoService();

repoRoutes.get('/workspaces/:workspaceId/repos', async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const repos = await repoService.getReposByWorkspace(workspaceId);
  return c.json({ items: repos });
});

repoRoutes.post('/workspaces/:workspaceId/repos', async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const body = await c.req.json<CreateRepositoryDto>();
  const repo = await repoService.createRepo(workspaceId, body);
  return c.json({ id: repo.id });
});

repoRoutes.get('/workspaces/:workspaceId/repos/:repoId', async (c) => {
  const repoId = c.req.param('repoId');
  const repo = await repoService.getRepo(repoId);
  if (!repo) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  return c.json(repo);
});

repoRoutes.put('/workspaces/:workspaceId/repos/:repoId', async (c) => {
  const repoId = c.req.param('repoId');
  const body = await c.req.json<UpdateRepositoryDto>();
  const repo = await repoService.updateRepo(repoId, body);
  if (!repo) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  return c.json(repo);
});

repoRoutes.delete('/workspaces/:workspaceId/repos/:repoId', async (c) => {
  const repoId = c.req.param('repoId');
  const deleted = await repoService.deleteRepo(repoId);
  if (!deleted) {
    return c.json({ error: 'Repository not found' }, 404);
  }
  return c.json({ status: 'deleted' });
});

export default repoRoutes;
