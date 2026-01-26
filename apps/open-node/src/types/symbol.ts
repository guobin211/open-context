export type SymbolKind =
  | 'function' | 'class' | 'method' | 'interface' | 'type' | 'variable' | 'enum'
  | 'rule' | 'class-selector' | 'id-selector' | 'pseudo-selector'
  | 'heading' | 'paragraph' | 'code-block' | 'list';
export type Visibility = 'public' | 'private' | 'protected';

export interface Symbol {
  id: string;
  repoId: string;
  fileId: string;
  name: string;
  qualifiedName: string;
  kind: SymbolKind;
  visibility: Visibility;
  exported: boolean;
  location: {
    startLine: number;
    endLine: number;
  };
  signature?: string;
  docComment?: string;
  codeChunk: string;
  commit: string;
  indexedAt: number;
}

export interface SymbolPayload {
  workspace_id: string;
  repo_id: string;
  repo_name: string;
  file_path: string;
  language: string;
  symbol_id: string;
  symbol_name: string;
  symbol_kind: SymbolKind;
  exported: boolean;
  visibility: Visibility;
  code: string;
  signature?: string;
  importance: number;
  commit: string;
  indexed_at: number;
}
