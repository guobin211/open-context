// GitRepository 类型定义

export interface GitRepository {
  id: string;
  workspaceId: string;
  name: string;
  remoteUrl: string;
  localPath: string;
  branch: string;
  defaultBranch?: string | null;
  lastCommitHash?: string | null;
  lastSyncedAt?: number | null;
  cloneStatus: 'pending' | 'cloning' | 'completed' | 'failed';
  cloneProgress: number;
  indexStatus: 'not_indexed' | 'indexing' | 'indexed' | 'failed';
  indexedAt?: number | null;
  fileCount: number;
  symbolCount: number;
  vectorCount: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CreateRepositoryDto {
  workspaceId: string;
  name: string;
  gitUrl: string;
  branch?: string;
}

export interface UpdateRepositoryDto {
  name?: string;
  remoteUrl?: string;
  branch?: string;
  defaultBranch?: string;
  cloneStatus?: string;
  cloneProgress?: number;
  indexStatus?: string;
  fileCount?: number;
  symbolCount?: number;
  vectorCount?: number;
}

// IndexJob 类型定义

export interface IndexJob {
  id: string;
  repoId: string;
  jobType: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  totalFiles?: number | null;
  processedFiles: number;
  totalSymbols?: number | null;
  processedSymbols: number;
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
  startedAt?: number | null;
  completedAt?: number | null;
  createdAt: number;
}

// IndexMetadata 类型定义

export interface IndexMetadata {
  id: string;
  repoId: string;
  filePath: string;
  contentHash: string;
  lastIndexedAt: number;
  symbolCount: number;
  language?: string | null;
  fileSize?: number | null;
}
