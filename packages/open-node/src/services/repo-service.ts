import { RepoRepository } from '../db';
import { Repository, CreateRepositoryDto, UpdateRepositoryDto } from '../types';
import { GitService, getRepoPath } from '../utils/git';
import logger from '../utils/logger';

export class RepoService {
  private repo = new RepoRepository();

  async createRepo(workspaceId: string, dto: CreateRepositoryDto): Promise<Repository> {
    logger.info({ workspaceId, name: dto.name }, 'Creating repository');
    const repository = await this.repo.create(workspaceId, dto);

    const repoPath = getRepoPath(repository.id);
    const git = new GitService(repoPath);
    await git.clone(dto.gitUrl, dto.branch);

    logger.info({ id: repository.id }, 'Repository created and cloned');
    return repository;
  }

  async getRepo(id: string): Promise<Repository | null> {
    return this.repo.findById(id);
  }

  async getReposByWorkspace(workspaceId: string): Promise<Repository[]> {
    return this.repo.findByWorkspaceId(workspaceId);
  }

  async updateRepo(id: string, dto: UpdateRepositoryDto): Promise<Repository | null> {
    logger.info({ id, ...dto }, 'Updating repository');
    return this.repo.update(id, dto);
  }

  async deleteRepo(id: string): Promise<boolean> {
    logger.info({ id }, 'Deleting repository');
    return this.repo.delete(id);
  }

  async updateIndexStatus(
    id: string,
    commit: string,
    languageStats: Record<string, number>
  ): Promise<Repository | null> {
    return this.repo.updateIndexStatus(id, commit, languageStats);
  }
}
