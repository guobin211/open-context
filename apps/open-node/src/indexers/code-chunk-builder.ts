import { ExtractedSymbol } from './code-symbol-extractor';
import { generateSymbolId, prepareEmbeddingText } from '../utils';
import { SymbolPayload } from '../types';

export interface CodeChunk {
  symbolId: string;
  embeddingText: string;
  payload: SymbolPayload;
}

export class CodeChunkBuilder {
  build(params: {
    workspaceId: string;
    repoId: string;
    repoName: string;
    filePath: string;
    language: string;
    commit: string;
    symbols: ExtractedSymbol[];
  }): CodeChunk[] {
    return params.symbols.map((symbol) => {
      const symbolId = generateSymbolId({
        workspaceId: params.workspaceId,
        repoId: params.repoId,
        filePath: params.filePath,
        symbolName: symbol.qualifiedName
      });

      const embeddingText = prepareEmbeddingText({
        signature: symbol.signature,
        code: symbol.codeChunk,
        docComment: symbol.docComment
      });

      const payload: SymbolPayload = {
        workspace_id: params.workspaceId,
        repo_id: params.repoId,
        repo_name: params.repoName,
        file_path: params.filePath,
        language: params.language,
        symbol_id: symbolId,
        symbol_name: symbol.name,
        symbol_kind: symbol.kind,
        exported: symbol.exported,
        visibility: symbol.visibility,
        code: symbol.codeChunk,
        signature: symbol.signature,
        importance: this.calculateImportance(symbol),
        commit: params.commit,
        indexed_at: Date.now()
      };

      return { symbolId, embeddingText, payload };
    });
  }

  private calculateImportance(symbol: ExtractedSymbol): number {
    let score = 0.5;

    if (symbol.exported) score += 0.3;
    if (symbol.visibility === 'public') score += 0.1;
    if (symbol.docComment) score += 0.1;

    return Math.min(score, 1.0);
  }
}
