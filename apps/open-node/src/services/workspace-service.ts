//! Workspace 服务层

import { getAppDatabase, WorkspaceRow } from '../db';
import { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '../types';
import logger from '../utils/logger';

/**
 * 将数据库行转换为 Workspace 类型
 */
function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    sortOrder: row.sort_order,
    isActive: row.is_active === 1,
    isArchived: row.is_archived === 1,
    settings: row.settings ? JSON.parse(row.settings) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class WorkspaceService {
  /**
   * 获取所有工作空间
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    const db = await getAppDatabase();
    const rows = db.getAllWorkspaces();
    return rows.map(rowToWorkspace);
  }

  /**
   * 获取单个工作空间
   */
  async getWorkspace(id: string): Promise<Workspace | null> {
    const db = await getAppDatabase();
    const row = db.getWorkspace(id);
    return row ? rowToWorkspace(row) : null;
  }

  /**
   * 获取当前活跃的工作空间
   */
  async getActiveWorkspace(): Promise<Workspace | null> {
    const db = await getAppDatabase();
    const row = db.getActiveWorkspace();
    return row ? rowToWorkspace(row) : null;
  }

  /**
   * 获取未归档的工作空间
   */
  async getUnarchivedWorkspaces(): Promise<Workspace[]> {
    const db = await getAppDatabase();
    const rows = db.getWorkspacesByArchived(0);
    return rows.map(rowToWorkspace);
  }

  /**
   * 获取工作空间统计信息
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    noteCount: number;
    fileCount: number;
    linkCount: number;
    repoCount: number;
    conversationCount: number;
  }> {
    const db = await getAppDatabase();
    return db.getWorkspaceStats(workspaceId);
  }

  /**
   * 创建工作空间（仅读取，创建由 Tauri 端执行）
   * @deprecated 工作空间创建应通过 Tauri 端完成
   */
  async createWorkspace(_dto: CreateWorkspaceDto): Promise<Workspace> {
    logger.warn('Workspace creation should be done through Tauri');
    throw new Error('Workspace creation should be done through Tauri');
  }

  /**
   * 更新工作空间（仅读取，更新由 Tauri 端执行）
   * @deprecated 工作空间更新应通过 Tauri 端完成
   */
  async updateWorkspace(_id: string, _dto: UpdateWorkspaceDto): Promise<Workspace | null> {
    logger.warn('Workspace update should be done through Tauri');
    throw new Error('Workspace update should be done through Tauri');
  }

  /**
   * 删除工作空间（仅读取，删除由 Tauri 端执行）
   * @deprecated 工作空间删除应通过 Tauri 端完成
   */
  async deleteWorkspace(_id: string): Promise<boolean> {
    logger.warn('Workspace deletion should be done through Tauri');
    throw new Error('Workspace deletion should be done through Tauri');
  }
}
