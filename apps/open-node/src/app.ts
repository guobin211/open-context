import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { logger as honoLogger } from 'hono/logger';
import dotenv from 'dotenv';
import { getLevelDBInstance, getQdrantInstance } from './db';
import { GraphService } from './services';
import router from './api/router';
import logger from './utils/logger';

dotenv.config();

const PORT = parseInt(process.env.PORT || '4500', 10);

export interface AppContext {
  Variables: {
    graphService: GraphService;
  };
}

async function main() {
  const app = new Hono<AppContext>();

  app.use('*', honoLogger());
  app.use('*', async (c, next) => {
    logger.info({ method: c.req.method, url: c.req.url }, 'Incoming request');
    await next();
  });

  logger.info('Initializing databases...');

  const leveldb = getLevelDBInstance();
  await leveldb.open();

  const qdrant = getQdrantInstance();
  await qdrant.init();

  logger.info('Loading graph...');
  const graphService = new GraphService();
  await graphService.init();

  app.use('*', async (c, next) => {
    c.set('graphService', graphService);
    await next();
  });

  app.route('/api/v1', router);

  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: Date.now() });
  });

  const server = serve({
    fetch: app.fetch,
    port: PORT,
    hostname: '0.0.0.0'
  });

  logger.info({ port: PORT }, 'Server started successfully');

  const shutdown = async () => {
    logger.info('Shutting down...');
    await leveldb.close();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error(error);
  process.exit(1);
});
