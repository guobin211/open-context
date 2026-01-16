import { JobRepository } from '../db';
import { IndexJobResult } from '../types';
import logger from '../utils/logger';

export class JobService {
  private repo = new JobRepository();

  async createJob(repoId: string, mode: 'full' | 'incremental'): Promise<IndexJobResult> {
    logger.info({ repoId, mode }, 'Creating index job');
    return this.repo.create(repoId, mode);
  }

  async getJob(jobId: string): Promise<IndexJobResult | null> {
    return this.repo.findById(jobId);
  }

  async updateJobStatus(
    jobId: string,
    status: IndexJobResult['status'],
    progress?: number,
    error?: string
  ): Promise<void> {
    await this.repo.updateStatus(jobId, status, progress, error);
  }
}
