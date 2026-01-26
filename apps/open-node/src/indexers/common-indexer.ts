import { CodeIndexer, type IndexParams } from '@/indexers/impl/code-indexer';
import { CodeChunk } from './core/code-chunk-builder';
import { GraphEdge } from './core/code-graph-builder';
import { MarkdownChunk, MarkdownIndexer } from './impl/markdown-indexer';

export class CommonIndexer {
  private markdownIndexer = new MarkdownIndexer();
  private codeIndexer = new CodeIndexer();

  async index(params: IndexParams): Promise<{ chunks: CodeChunk[] | MarkdownChunk[]; edges: GraphEdge[] }> {
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
    const { chunks, edges } = this.codeIndexer.index(params);
    return { chunks, edges };
  }

  async indexFile(text: string, filePath: string): Promise<{ chunks: MarkdownChunk[]; edges: GraphEdge[] }> {
    const chunks = this.markdownIndexer.indexFile(text, filePath);
    return { chunks, edges: [] };
  }
}
