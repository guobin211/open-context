//! 索引任务服务层

import { getAppDatabase, IndexJobRow } from '../db';
import { IndexJob, IndexJobResult } from '../types';
import { generateUUID } from '../utils/id';
import logger from '../utils/logger';

/**
 * 将数据库行转换为 IndexJob 类型
 */
function rowToIndexJob(row: IndexJobRow): IndexJob {
  return {
    id: row.id,
    repoId: row.repo_id,
    jobType: row.job_type as IndexJob['jobType'],
    status: row.status as IndexJob['status'],
    progress: row.progress,
    totalFiles: row.total_files,
    processedFiles: row.processed_files,
    totalSymbols: row.total_symbols,
    processedSymbols: row.processed_symbols,
    errorMessage: row.error_message,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at
  };
}

/**
 * 将 IndexJob 转换为 IndexJobResult
 */
function jobToResult(job: IndexJob): IndexJobResult {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    error: job.errorMessage ?? undefined
  };
}

export class JobService {
  /**
   * 创建索引任务
   */
  async createJob(repoId: string, mode: 'full' | 'incremental'): Promise<IndexJobResult> {
    logger.info({ repoId, mode }, 'Creating index job');

    const db = await getAppDatabase();
    const jobId = `job_${generateUUID()}`;

    const job = db.createIndexJob({
      id: jobId,
      repo_id: repoId,
      job_type: mode,
      status: 'pending',
      progress: 0,
      total_files: null,
      processed_files: 0,
      total_symbols: null,
      processed_symbols: 0,
      error_message: null,
      metadata: null,
      started_at: null,
      completed_at: null
    });

    logger.info({ jobId }, 'Index job created');
    return {
      jobId: job.id,
      status: job.status as IndexJobResult['status'],
      progress: job.progress
    };
  }

  /**
   * 获取索引任务
   */
  async getJob(jobId: string): Promise<IndexJob | null> {
    const db = await getAppDatabase();
    const row = db.getIndexJob(jobId);
    return row ? rowToIndexJob(row) : null;
  }

  /**
   * 获取索引任务结果
   */
  async getJobResult(jobId: string): Promise<IndexJobResult | null> {
    const job = await this.getJob(jobId);
    return job ? jobToResult(job) : null;
  }

  /**
   * 获取仓库的索引任务列表
   */
  async getJobsByRepo(repoId: string, limit = 10): Promise<IndexJob[]> {
    const db = await getAppDatabase();
    const rows = db.getIndexJobsByRepo(repoId, limit);
    return rows.map(rowToIndexJob);
  }

  /**
   * 获取最新的索引任务
   */
  async getLatestJob(repoId: string): Promise<IndexJob | null> {
    const db = await getAppDatabase();
    const row = db.getLatestIndexJob(repoId);
    return row ? rowToIndexJob(row) : null;
  }

  /**
   * 获取指定状态的索引任务
   */
  async getJobsByStatus(status: string): Promise<IndexJob[]> {
    const db = await getAppDatabase();
    const rows = db.getIndexJobsByStatus(status);
    return rows.map(rowToIndexJob);
  }

  /**
   * 启动索引任务
   */
  async startJob(jobId: string): Promise<void> {
    logger.info({ jobId }, 'Starting index job');
    const db = await getAppDatabase();
    db.startIndexJob(jobId);
  }

  /**
   * 更新任务进度
   */
  async updateJobProgress(
    jobId: string,
    progress: number,
    processedFiles: number,
    processedSymbols: number
  ): Promise<void> {
    const db = await getAppDatabase();
    db.updateIndexJobProgress(jobId, progress, processedFiles, processedSymbols);
  }

  /**
   * 更新任务状态
   */
  async updateJobStatus(
    jobId: string,
    status: IndexJobResult['status'],
    progress?: number,
    error?: string
  ): Promise<void> {
    logger.info({ jobId, status, progress }, 'Updating job status');
    const db = await getAppDatabase();

    if (status === 'completed') {
      db.updateIndexJobStatus(jobId, status, null, Date.now());
    } else if (status === 'failed') {
      db.updateIndexJobStatus(jobId, status, error ?? null, Date.now());
    } else {
      db.updateIndexJobStatus(jobId, status, error ?? null, null);
    }

    if (progress !== undefined) {
      db.updateIndexJobProgress(jobId, progress, 0, 0);
    }
  }

  /**
   * 完成索引任务
   */
  async completeJob(jobId: string, totalFiles: number, totalSymbols: number): Promise<void> {
    logger.info({ jobId, totalFiles, totalSymbols }, 'Completing index job');
    const db = await getAppDatabase();
    db.completeIndexJob(jobId, totalFiles, totalSymbols);
  }

  /**
   * 标记任务失败
   */
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    logger.error({ jobId, errorMessage }, 'Index job failed');
    const db = await getAppDatabase();
    db.failIndexJob(jobId, errorMessage);
  }
}
