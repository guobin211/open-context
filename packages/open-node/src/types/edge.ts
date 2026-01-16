export type EdgeType = 'IMPORTS' | 'CALLS' | 'IMPLEMENTS' | 'EXTENDS' | 'USES' | 'REFERENCES';

export interface Edge {
  id: string;
  fromSymbolId: string;
  toSymbolId?: string;
  type: EdgeType;
  confidence: number;
}

export interface DependencyResult {
  from: string;
  edges: Array<{
    to: string;
    type: EdgeType;
    confidence?: number;
  }>;
}

export interface TraverseResult {
  nodes: string[];
  edges: Array<{
    from: string;
    to: string;
    type: EdgeType;
  }>;
}
