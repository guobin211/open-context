export interface VectorSearchOptions {
  workspaceId: string;
  query: string;
  topK?: number;
  filters?: {
    repoIds?: string[];
    symbolKinds?: string[];
    exported?: boolean;
    language?: string;
  };
}

export interface VectorSearchResult {
  symbolId: string;
  repo: string;
  file: string;
  score: number;
  code: string;
  signature?: string;
  kind: string;
}

export interface CodeQueryOptions extends VectorSearchOptions {
  expandGraph?: {
    type?: string;
    depth?: number;
  };
}

export interface CodeQueryResult extends VectorSearchResult {
  dependencies?: Array<{
    symbolId: string;
    code: string;
    type: string;
  }>;
}
