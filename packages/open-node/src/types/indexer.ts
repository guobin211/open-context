export interface IndexJobOptions {
  repoId: string;
  mode: 'full' | 'incremental';
  workspaceId: string;
}

export interface IndexJobResult {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
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
