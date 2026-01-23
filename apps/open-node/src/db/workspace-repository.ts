import { getLevelDBInstance } from './leveldb';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types';
import { generateUUID } from '../utils/id';

export class WorkspaceRepository {
  private db = getLevelDBInstance();
  private prefix = 'workspace:';

  async create(dto: CreateWorkspaceDto): Promise<Workspace> {
    const workspace: Workspace = {
      id: `ws_${generateUUID()}`,
      name: dto.name,
      description: dto.description,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${workspace.id}`, workspace);
    return workspace;
  }

  async findById(id: string): Promise<Workspace | null> {
    return this.db.get<Workspace>(`${this.prefix}${id}`);
  }

  async findAll(): Promise<Workspace[]> {
    return this.db.getByPrefix<Workspace>(this.prefix);
  }

  async update(id: string, dto: UpdateWorkspaceDto): Promise<Workspace | null> {
    const workspace = await this.findById(id);
    if (!workspace) return null;

    const updated: Workspace = {
      ...workspace,
      ...dto,
      updatedAt: Date.now()
    };

    await this.db.put(`${this.prefix}${id}`, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const workspace = await this.findById(id);
    if (!workspace) return false;

    await this.db.delete(`${this.prefix}${id}`);
    return true;
  }
}
