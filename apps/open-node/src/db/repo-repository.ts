import { getLevelDBInstance } from './leveldb';
import { Repository, CreateRepositoryDto, UpdateRepositoryDto } from '../types';
import { generateUUID } from '../utils/id';

export class RepoRepository {
  private db = getLevelDBInstance();
  private prefix = 'repo:';

  async create(workspaceId: string, dto: CreateRepositoryDto): Promise<Repository> {
    const repo: Repository = {
      id: `repo_${generateUUID()}`,
      workspaceId,
      name: dto.name,
      url: dto.gitUrl,
      defaultBranch: dto.branch || 'main',
      languageStats: {},
      lastIndexedCommit: '',
      indexedAt: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${repo.id}`, repo);
    return repo;
  }

  async findById(id: string): Promise<Repository | null> {
    return this.db.get<Repository>(`${this.prefix}${id}`);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Repository[]> {
    const allRepos = await this.db.getByPrefix<Repository>(this.prefix);
    return allRepos.filter((repo) => repo.workspaceId === workspaceId);
  }

  async update(id: string, dto: UpdateRepositoryDto): Promise<Repository | null> {
    const repo = await this.findById(id);
    if (!repo) return null;

    const updated: Repository = {
      ...repo,
      ...dto,
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${id}`, updated);
    return updated;
  }

  async updateIndexStatus(
    id: string,
    commit: string,
    languageStats: Record<string, number>
  ): Promise<Repository | null> {
    const repo = await this.findById(id);
    if (!repo) return null;

    const updated: Repository = {
      ...repo,
      lastIndexedCommit: commit,
      indexedAt: Date.now(),
      languageStats,
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${id}`, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const repo = await this.findById(id);
    if (!repo) return false;

    await this.db.delete(`${this.prefix}${id}`);
    return true;
  }
}
