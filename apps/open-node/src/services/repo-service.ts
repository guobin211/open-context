//! Git 仓库服务层

import { getAppDatabase, GitRepositoryRow } from '../db';
import { GitRepository, CreateRepositoryDto, UpdateRepositoryDto } from '../types';
import { GitService, getRepoPath } from '../utils/git';
import logger from '../utils/logger';

/**
 * 将数据库行转换为 GitRepository 类型
 */
function rowToRepository(row: GitRepositoryRow): GitRepository {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    remoteUrl: row.remote_url,
    localPath: row.local_path,
    branch: row.branch,
    defaultBranch: row.default_branch,
    lastCommitHash: row.last_commit_hash,
    lastSyncedAt: row.last_synced_at,
    cloneStatus: row.clone_status as GitRepository['cloneStatus'],
    cloneProgress: row.clone_progress,
    indexStatus: row.index_status as GitRepository['indexStatus'],
    indexedAt: row.indexed_at,
    fileCount: row.file_count,
    symbolCount: row.symbol_count,
    vectorCount: row.vector_count,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class RepoService {
  /**
   * 获取单个仓库
   */
  async getRepo(id: string): Promise<GitRepository | null> {
    const db = await getAppDatabase();
    const row = db.getRepository(id);
    return row ? rowToRepository(row) : null;
  }

  /**
   * 获取所有仓库
   */
  async getAllRepos(): Promise<GitRepository[]> {
    const db = await getAppDatabase();
    const rows = db.getAllRepositories();
    return rows.map(rowToRepository);
  }

  /**
   * 获取工作空间下的所有仓库
   */
  async getReposByWorkspace(workspaceId: string): Promise<GitRepository[]> {
    const db = await getAppDatabase();
    const rows = db.getRepositoriesByWorkspace(workspaceId);
    return rows.map(rowToRepository);
  }

  /**
   * 获取指定索引状态的仓库
   */
  async getReposByIndexStatus(status: string): Promise<GitRepository[]> {
    const db = await getAppDatabase();
    const rows = db.getRepositoriesByIndexStatus(status);
    return rows.map(rowToRepository);
  }

  /**
   * 获取指定克隆状态的仓库
   */
  async getReposByCloneStatus(status: string): Promise<GitRepository[]> {
    const db = await getAppDatabase();
    const rows = db.getRepositoriesByCloneStatus(status);
    return rows.map(rowToRepository);
  }

  /**
   * 获取仓库本地路径
   */
  getRepoLocalPath(repoId: string): string {
    return getRepoPath(repoId);
  }

  /**
   * 拉取仓库最新代码
   */
  async pullRepo(id: string): Promise<boolean> {
    const repo = await this.getRepo(id);
    if (!repo) {
      logger.warn({ id }, 'Repository not found');
      return false;
    }

    try {
      const git = new GitService(repo.localPath);
      await git.pull();
      logger.info({ id }, 'Repository pulled');
      return true;
    } catch (error) {
      logger.error({ id, error }, 'Failed to pull repository');
      return false;
    }
  }

  /**
   * 获取仓库当前提交哈希
   */
  async getCurrentCommit(id: string): Promise<string | null> {
    const repo = await this.getRepo(id);
    if (!repo) return null;

    try {
      const git = new GitService(repo.localPath);
      return await git.getCurrentCommit();
    } catch {
      return null;
    }
  }

  /**
   * 创建仓库（仅读取，创建由 Tauri 端执行）
   * @deprecated 仓库创建应通过 Tauri 端完成
   */
  async createRepo(_workspaceId: string, _dto: CreateRepositoryDto): Promise<GitRepository> {
    logger.warn('Repository creation should be done through Tauri');
    throw new Error('Repository creation should be done through Tauri');
  }

  /**
   * 更新仓库（仅读取，更新由 Tauri 端执行）
   * @deprecated 仓库更新应通过 Tauri 端完成
   */
  async updateRepo(_id: string, _dto: UpdateRepositoryDto): Promise<GitRepository | null> {
    logger.warn('Repository update should be done through Tauri');
    throw new Error('Repository update should be done through Tauri');
  }

  /**
   * 删除仓库（仅读取，删除由 Tauri 端执行）
   * @deprecated 仓库删除应通过 Tauri 端完成
   */
  async deleteRepo(_id: string): Promise<boolean> {
    logger.warn('Repository deletion should be done through Tauri');
    throw new Error('Repository deletion should be done through Tauri');
  }

  /**
   * 更新索引状态（仅读取，更新由 Tauri 端执行）
   * @deprecated 索引状态更新应通过 Tauri 端完成
   */
  async updateIndexStatus(
    _id: string,
    _commit: string,
    _languageStats: Record<string, number>
  ): Promise<GitRepository | null> {
    logger.warn('Index status update should be done through Tauri');
    throw new Error('Index status update should be done through Tauri');
  }
}
