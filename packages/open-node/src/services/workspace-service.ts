import { WorkspaceRepository } from '../db';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types';
import logger from '../utils/logger';

export class WorkspaceService {
  private repo = new WorkspaceRepository();

  async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    logger.info({ name: dto.name }, 'Creating workspace');
    const workspace = await this.repo.create(dto);
    logger.info({ id: workspace.id }, 'Workspace created');
    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.repo.findById(id);
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    return this.repo.findAll();
  }

  async updateWorkspace(id: string, dto: UpdateWorkspaceDto): Promise<Workspace | null> {
    logger.info({ id, ...dto }, 'Updating workspace');
    return this.repo.update(id, dto);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    logger.info({ id }, 'Deleting workspace');
    return this.repo.delete(id);
  }
}
