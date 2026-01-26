export interface Repository {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  defaultBranch: string;
  languageStats: {
    [key: string]: number | undefined;
  };
  lastIndexedCommit: string;
  indexedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateRepositoryDto {
  name: string;
  gitUrl: string;
  branch?: string;
}

export interface UpdateRepositoryDto {
  name?: string;
  url?: string;
  defaultBranch?: string;
}
