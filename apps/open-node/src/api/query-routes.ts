import { Hono } from 'hono';
import { RAGService } from '../services';
import { VectorSearchOptions, CodeQueryOptions } from '../types';
import { AppContext } from '../app';

const queryRoutes = new Hono<AppContext>();

queryRoutes.post('/query/vector', async (c) => {
  const graphService = c.get('graphService');
  const ragService = new RAGService(graphService);
  const body = await c.req.json<VectorSearchOptions>();
  const results = await ragService.query(body);
  return c.json({ matches: results });
});

queryRoutes.post('/query/code', async (c) => {
  const graphService = c.get('graphService');
  const ragService = new RAGService(graphService);
  const body = await c.req.json<CodeQueryOptions>();
  const results = await ragService.query(body);
  return c.json({ matches: results });
});

export default queryRoutes;
