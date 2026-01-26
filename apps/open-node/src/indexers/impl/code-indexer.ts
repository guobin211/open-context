import { type CodeChunk, CodeChunkBuilder } from '@/indexers/core/code-chunk-builder';
import { GraphBuilder, type GraphEdge } from '@/indexers/core/code-graph-builder';
import { SymbolExtractor } from '@/indexers/core/code-symbol-extractor';
import { ASTParser, getASTParser, SupportLanguage } from '../core/ast-parser';

export interface IndexParams {
  code: string;
  language: SupportLanguage;
  filePath: string;
  workspaceId: string;
  repoId: string;
  repoName: string;
  commit: string;
}

export interface IndexResult {
  chunks: CodeChunk[];
  edges: GraphEdge[];
}

export class CodeIndexer {
  private parser = getASTParser();
  private symbolExtractor = new SymbolExtractor(this.parser);
  private chunkBuilder = new CodeChunkBuilder();
  private graphBuilder = new GraphBuilder(this.parser);

  getParser(): ASTParser {
    return this.parser;
  }

  index(params: IndexParams): IndexResult {
    const parseResult = this.parser.parseWithResult(params.code, params.language, params.filePath);
    const symbols = this.symbolExtractor.extractFromParseResult(parseResult);
    const chunks = this.chunkBuilder.build({
      ...params,
      symbols
    });
    const edges = this.graphBuilder.buildFromParseResult(parseResult, {
      ...params
    });
    return { chunks, edges };
  }
}
