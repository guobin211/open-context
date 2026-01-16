import { IndexJob } from './index-job';
import { GraphService } from '../services';
import logger from '../utils/logger';

export class ReindexJob {
  private indexJob: IndexJob;

  constructor(graphService: GraphService) {
    this.indexJob = new IndexJob(graphService);
  }

  async execute(params: { jobId: string; repoId: string; workspaceId: string }): Promise<void> {
    logger.info({ repoId: params.repoId }, 'Starting reindex job');

    await this.indexJob.execute({
      ...params,
      mode: 'incremental'
    });

    logger.info({ repoId: params.repoId, jobId: params.jobId }, 'Reindex job completed');
  }
}
