export interface IndexJobOptions {
  repoId: string;
  mode: 'full' | 'incremental';
  workspaceId: string;
}

// 索引任务结果（用于 API 响应）
export interface IndexJobResult {
  jobId: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  error?: string;
}

export interface FileMetadata {
  id: string;
  repoId: string;
  path: string;
  language: string;
  size: number;
  checksum: string;
  lastModifiedCommit: string;
}

export interface ParsedFile {
  file: FileMetadata;
  symbols: Array<{
    name: string;
    qualifiedName: string;
    kind: string;
    visibility: string;
    exported: boolean;
    location: { startLine: number; endLine: number };
    signature?: string;
    docComment?: string;
    codeChunk: string;
  }>;
  imports: string[];
  calls: Array<{ from: string; to: string }>;
}
