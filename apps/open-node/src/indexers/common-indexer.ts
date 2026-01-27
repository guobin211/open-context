import { CodeIndexer, type IndexParams } from '@/indexers/impl/code-indexer';
import { CodeChunk } from './core/code-chunk-builder';
import { GraphEdge } from './core/code-graph-builder';
import { MarkdownChunk, MarkdownIndexer } from './impl/markdown-indexer';
import { getSurrealDBInstance, SurrealSymbol } from '@/db/surreal';
import { generateContentHash, generateShortId } from '@/utils/hash';
import { SupportLanguage } from './core/ast-parser';
import { GitService } from '@/utils/git';
import logger from '@/utils/logger';

export interface IndexFileOptions {
  filePath: string;
  content: string;
  metadata?: Partial<IndexParams>;
}

export interface IndexContentOptions {
  content: string;
  language: SupportLanguage;
  metadata?: Partial<IndexParams>;
}

export interface IndexGitRepoOptions {
  repoPath: string;
  repoId: string;
  workspaceId?: string;
  repoName?: string;
}

export interface IndexGitRepoResult {
  totalFiles: number;
  indexedFiles: number;
  skippedFiles: number;
  totalSymbols: number;
  errors: Array<{ file: string; error: string }>;
}

export class CommonIndexer {
  private markdownIndexer = new MarkdownIndexer();
  private codeIndexer = new CodeIndexer();
  private surrealdb = getSurrealDBInstance();

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

  /**
   * 检查文件是否已索引（基于内容哈希）
   */
  async checkDuplicate(filePath: string, content: string): Promise<boolean> {
    try {
      const contentHash = generateContentHash(content);
      // 使用精确查询而非全文检索
      const result = await this.surrealdb.findByFilePathAndHash(filePath, contentHash);
      return result !== null;
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to check duplicate');
      return false;
    }
  }

  /**
   * 索引单个文件
   */
  async indexFile(options: IndexFileOptions): Promise<{ chunks: CodeChunk[] | MarkdownChunk[]; edges: GraphEdge[] }> {
    const { filePath, content, metadata } = options;

    // 生成内容哈希
    const contentHash = generateContentHash(content);

    // 检查重复
    const isDuplicate = await this.checkDuplicate(filePath, content);
    if (isDuplicate) {
      logger.info({ filePath }, 'File already indexed, skipping');
      return { chunks: [], edges: [] };
    }

    // 检测语言
    const language = this.detectLanguage(filePath);
    if (!language) {
      logger.warn({ filePath }, 'Unsupported file type');
      return { chunks: [], edges: [] };
    }

    // 构建索引参数
    const params: IndexParams = {
      code: content,
      language,
      filePath,
      workspaceId: metadata?.workspaceId || 'virtual',
      repoId: metadata?.repoId || `virtual-${generateShortId()}`,
      repoName: metadata?.repoName || 'untitled',
      commit: metadata?.commit || 'HEAD'
    };

    // 执行索引
    const result = await this.index(params);

    // 存储到 SurrealDB
    await this.storeSymbols(result.chunks, contentHash);
    await this.storeEdges(result.edges);

    return result;
  }

  /**
   * 索引代码片段（无文件路径）
   */
  async indexContent(
    options: IndexContentOptions
  ): Promise<{ chunks: CodeChunk[] | MarkdownChunk[]; edges: GraphEdge[] }> {
    const { content, language, metadata } = options;

    // 生成虚拟文件路径
    const timestamp = Date.now();
    const filePath = `<snippet-${timestamp}>`;
    const contentHash = generateContentHash(content);

    // 构建索引参数
    const params: IndexParams = {
      code: content,
      language,
      filePath,
      workspaceId: metadata?.workspaceId || 'virtual',
      repoId: metadata?.repoId || `virtual-${generateShortId()}`,
      repoName: metadata?.repoName || 'untitled',
      commit: metadata?.commit || 'HEAD'
    };

    // 执行索引
    const result = await this.index(params);

    // 存储到 SurrealDB
    await this.storeSymbols(result.chunks, contentHash);
    await this.storeEdges(result.edges);

    return result;
  }

  /**
   * 索引 Git 仓库
   */
  async indexGitRepo(options: IndexGitRepoOptions): Promise<IndexGitRepoResult> {
    const { repoPath, repoId, workspaceId = 'default', repoName } = options;

    logger.info({ repoPath, repoId }, 'Starting Git repository indexing');

    const gitService = new GitService(repoPath);
    const result: IndexGitRepoResult = {
      totalFiles: 0,
      indexedFiles: 0,
      skippedFiles: 0,
      totalSymbols: 0,
      errors: []
    };

    try {
      // 获取当前 commit
      const commit = await gitService.getCurrentCommit();

      // 列出所有文件
      const files = await gitService.listFiles();
      result.totalFiles = files.length;

      logger.info({ totalFiles: result.totalFiles }, 'Found files in repository');

      // 逐个索引文件
      for (const filePath of files) {
        try {
          // 检测语言
          const language = this.detectLanguage(filePath);
          if (!language) {
            result.skippedFiles++;
            logger.debug({ filePath }, 'Skipping unsupported file type');
            continue;
          }

          // 读取文件内容
          const content = await gitService.readFile(filePath);

          // 检查重复
          const isDuplicate = await this.checkDuplicate(filePath, content);
          if (isDuplicate) {
            result.skippedFiles++;
            logger.debug({ filePath }, 'File already indexed, skipping');
            continue;
          }

          // 索引文件
          const indexResult = await this.indexFile({
            filePath,
            content,
            metadata: {
              workspaceId,
              repoId,
              repoName: repoName || repoPath.split('/').pop() || 'unknown',
              commit
            }
          });

          result.indexedFiles++;
          result.totalSymbols += indexResult.chunks.length;

          if (result.indexedFiles % 10 === 0) {
            logger.info({ indexed: result.indexedFiles, total: result.totalFiles }, 'Indexing progress');
          }
        } catch (error) {
          result.errors.push({
            file: filePath,
            error: error instanceof Error ? error.message : String(error)
          });
          logger.error({ filePath, error }, 'Failed to index file');
        }
      }

      logger.info(
        {
          totalFiles: result.totalFiles,
          indexedFiles: result.indexedFiles,
          skippedFiles: result.skippedFiles,
          totalSymbols: result.totalSymbols,
          errors: result.errors.length
        },
        'Git repository indexing completed'
      );

      return result;
    } catch (error) {
      logger.error({ error, repoPath }, 'Failed to index Git repository');
      throw error;
    }
  }

  /**
   * 存储符号到 SurrealDB
   */
  private async storeSymbols(chunks: CodeChunk[] | MarkdownChunk[], contentHash: string): Promise<void> {
    const symbols: SurrealSymbol[] = chunks.map((chunk) => ({
      ...chunk.payload,
      content_hash: contentHash
    }));

    await this.surrealdb.batchUpsertSymbols(symbols);
  }

  /**
   * 存储边到 SurrealDB
   */
  private async storeEdges(edges: GraphEdge[]): Promise<void> {
    const edgeData = edges.map((edge) => ({
      from: edge.from,
      to: edge.to || '',
      type: edge.type
    }));

    await this.surrealdb.batchCreateEdges(edgeData);
  }

  /**
   * 根据文件扩展名检测语言
   */
  private detectLanguage(filePath: string): SupportLanguage | null {
    const ext = filePath.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, SupportLanguage> = {
      ts: 'ts',
      tsx: 'tsx',
      js: 'js',
      jsx: 'jsx',
      py: 'python',
      go: 'go',
      c: 'c',
      cpp: 'cpp',
      cc: 'cpp',
      cxx: 'cpp',
      cs: 'csharp',
      css: 'css',
      html: 'html',
      md: 'markdown',
      json: 'json',
      sh: 'bash',
      bash: 'bash'
    };

    return ext ? languageMap[ext] || null : null;
  }
}
