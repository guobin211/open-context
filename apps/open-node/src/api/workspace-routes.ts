import { Hono } from 'hono';
import { WorkspaceService } from '../services';
import { CreateWorkspaceDto, UpdateWorkspaceDto } from '../types';
import { AppContext } from '../app';

const workspaceRoutes = new Hono<AppContext>();
const workspaceService = new WorkspaceService();

workspaceRoutes.get('/workspaces', async (c) => {
  const workspaces = await workspaceService.getAllWorkspaces();
  return c.json({ items: workspaces });
});

workspaceRoutes.post('/workspaces', async (c) => {
  const body = await c.req.json<CreateWorkspaceDto>();
  const workspace = await workspaceService.createWorkspace(body);
  return c.json({ id: workspace.id });
});

workspaceRoutes.get('/workspaces/:workspaceId', async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const workspace = await workspaceService.getWorkspace(workspaceId);
  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404);
  }
  return c.json(workspace);
});

workspaceRoutes.put('/workspaces/:workspaceId', async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const body = await c.req.json<UpdateWorkspaceDto>();
  const workspace = await workspaceService.updateWorkspace(workspaceId, body);
  if (!workspace) {
    return c.json({ error: 'Workspace not found' }, 404);
  }
  return c.json(workspace);
});

workspaceRoutes.delete('/workspaces/:workspaceId', async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const deleted = await workspaceService.deleteWorkspace(workspaceId);
  if (!deleted) {
    return c.json({ error: 'Workspace not found' }, 404);
  }
  return c.json({ status: 'deleted' });
});

export default workspaceRoutes;
