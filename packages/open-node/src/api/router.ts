import { Hono } from 'hono';
import workspaceRoutes from './workspace-routes';
import repoRoutes from './repo-routes';
import indexRoutes from './index-routes';
import queryRoutes from './query-routes';
import graphRoutes from './graph-routes';
import { AppContext } from '../app';

const router = new Hono<AppContext>();

router.route('/', workspaceRoutes);
router.route('/', repoRoutes);
router.route('/', indexRoutes);
router.route('/', queryRoutes);
router.route('/', graphRoutes);

export default router;
