import { Hono } from 'hono';
import { EdgeType } from '../types';
import { AppContext } from '../app';

const graphRoutes = new Hono<AppContext>();

graphRoutes.get('/graph/deps', async (c) => {
  const graphService = c.get('graphService');
  const symbolId = c.req.query('symbolId') as string;
  const type = c.req.query('type') as EdgeType | undefined;
  const result = graphService.getDependencies(symbolId, type);
  return c.json(result);
});

graphRoutes.get('/graph/reverse-deps', async (c) => {
  const graphService = c.get('graphService');
  const symbolId = c.req.query('symbolId') as string;
  const type = c.req.query('type') as EdgeType | undefined;
  const result = graphService.getReverseDependencies(symbolId, type);
  return c.json(result);
});

graphRoutes.get('/graph/traverse', async (c) => {
  const graphService = c.get('graphService');
  const symbolId = c.req.query('symbolId') as string;
  const depth = parseInt(c.req.query('depth') || '2', 10);
  const type = c.req.query('type') as EdgeType | undefined;
  const result = graphService.traverse(symbolId, depth, type);
  return c.json(result);
});

export default graphRoutes;
