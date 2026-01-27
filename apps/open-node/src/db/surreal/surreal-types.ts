import { EdgeType, SymbolPayload } from '@/types';

export const DB_NAME = 'open_context';
export const NAMESPACE = 'code_index';

export interface SurrealSymbol extends SymbolPayload {
  id?: string;
  content_hash: string;
}

export interface SurrealEdge {
  in: string;
  out: string;
}

export interface FullTextSearchOptions {
  query: string;
  workspaceId: string;
  limit?: number;
  filters?: {
    repoIds?: string[];
    language?: string;
    symbolKinds?: string[];
  };
}

export interface FullTextSearchResult {
  symbolId: string;
  symbolName: string;
  code: string;
  filePath: string;
  bm25Score: number;
}

export interface GraphQueryOptions {
  symbolId: string;
  depth?: number;
  edgeType?: EdgeType;
  direction?: 'outbound' | 'inbound' | 'both';
}

export interface GraphQueryResult {
  nodes: string[];
  edges: Array<{
    from: string;
    to: string;
    type: EdgeType;
  }>;
}
