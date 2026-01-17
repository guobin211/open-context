import { IndexJob } from './index-job';
import { ReindexJob } from './reindex-job';
import { GraphService } from '../services';
import logger from '../utils/logger';

interface Job {
  jobId: string;
  repoId: string;
  workspaceId: string;
  mode: 'full' | 'incremental';
}

export class JobQueue {
  private queue: Job[] = [];
  private processing = false;
  private indexJob: IndexJob;
  private reindexJob: ReindexJob;

  constructor(graphService: GraphService) {
    this.indexJob = new IndexJob(graphService);
    this.reindexJob = new ReindexJob(graphService);
  }

  enqueue(job: Job): void {
    this.queue.push(job);
    logger.info({ jobId: job.jobId }, 'Job enqueued');
    this.process().catch((error) => {
      logger.error({ error }, 'Job processing failed');
    });
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;

      try {
        if (job.mode === 'full') {
          await this.indexJob.execute(job);
        } else {
          await this.reindexJob.execute(job);
        }
      } catch (error) {
        logger.error({ error, jobId: job.jobId }, 'Job execution failed');
      }
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

let instance: JobQueue | null = null;

export function getJobQueueInstance(graphService: GraphService): JobQueue {
  if (!instance) {
    instance = new JobQueue(graphService);
  }
  return instance;
}
