import { getASTParser, SupportLanguage } from './ast-parser';
import { SymbolExtractor } from './code-symbol-extractor';
import { CodeChunk, CodeChunkBuilder } from './code-chunk-builder';
import { GraphBuilder, GraphEdge } from './code-graph-builder';
import { MarkdownIndexer, MarkdownChunk } from './markdown-indexer';

export class FileIndexer {
  private parser = getASTParser();
  private symbolExtractor = new SymbolExtractor(this.parser);
  private chunkBuilder = new CodeChunkBuilder();
  private graphBuilder = new GraphBuilder(this.parser);
  private markdownIndexer = new MarkdownIndexer();

  async index(params: {
    code: string;
    language: SupportLanguage;
    filePath: string;
    workspaceId: string;
    repoId: string;
    repoName: string;
    commit: string;
  }): Promise<{ chunks: CodeChunk[] | MarkdownChunk[]; edges: GraphEdge[] }> {
    // Markdown 文件使用专用索引器
    if (params.language === 'markdown') {
      const chunks = this.markdownIndexer.index({
        code: params.code,
        filePath: params.filePath,
        workspaceId: params.workspaceId,
        repoId: params.repoId,
        repoName: params.repoName,
        commit: params.commit
      });
      return { chunks, edges: [] };
    }
    // 其他语言使用通用索引器
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
