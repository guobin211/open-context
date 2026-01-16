import { getLevelDBInstance } from './leveldb';
import { IndexJobResult } from '../types';
import { generateNanoId } from '../utils/id';

export class JobRepository {
  private db = getLevelDBInstance();
  private prefix = 'job:';

  async create(repoId: string, mode: 'full' | 'incremental'): Promise<IndexJobResult> {
    const job: IndexJobResult = {
      jobId: `job_${generateNanoId()}`,
      status: 'queued',
      progress: 0
    };

    await this.db.put(`${this.prefix}${job.jobId}`, {
      ...job,
      repoId,
      mode,
      createdAt: Date.now()
    });

    return job;
  }

  async findById(jobId: string): Promise<IndexJobResult | null> {
    return this.db.get<IndexJobResult>(`${this.prefix}${jobId}`);
  }

  async updateStatus(
    jobId: string,
    status: IndexJobResult['status'],
    progress?: number,
    error?: string
  ): Promise<void> {
    const job = await this.findById(jobId);
    if (!job) return;

    const updated = {
      ...job,
      status,
      progress: progress ?? job.progress,
      error,
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${jobId}`, updated);
  }
}
