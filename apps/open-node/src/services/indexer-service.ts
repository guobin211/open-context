import { SymbolExtractor, CodeChunkBuilder, GraphBuilder } from '../indexers';
import { GitService, getRepoPath } from '../utils/git';
import { getLanguageFromExtension, getFileExtension } from '../utils/fs';
import { Repository } from '../types';
import logger from '../utils/logger';

export class IndexerService {
  private symbolExtractor = new SymbolExtractor();
  private chunkBuilder = new CodeChunkBuilder();
  private graphBuilder = new GraphBuilder();

  async indexRepository(params: { repository: Repository; workspaceId: string; mode: 'full' | 'incremental' }) {
    const repoPath = getRepoPath(params.repository.id);
    const git = new GitService(repoPath);

    if (params.mode === 'incremental') {
      await git.pull();
    }

    const currentCommit = await git.getCurrentCommit();
    const files = await git.listFiles();

    logger.info({ repoId: params.repository.id, fileCount: files.length }, 'Indexing files');

    const chunks = [];
    const edges = [];
    const languageStats: Record<string, number> = {};

    for (const file of files) {
      const ext = getFileExtension(file);
      const language = getLanguageFromExtension(ext);

      if (language !== 'typescript' && language !== 'javascript') {
        continue;
      }

      languageStats[language] = (languageStats[language] || 0) + 1;

      const code = await git.readFile(file);

      const symbols = this.symbolExtractor.extract(code, language as any);

      const fileChunks = this.chunkBuilder.build({
        workspaceId: params.workspaceId,
        repoId: params.repository.id,
        repoName: params.repository.name,
        filePath: file,
        language,
        commit: currentCommit,
        symbols
      });

      chunks.push(...fileChunks);

      const fileEdges = this.graphBuilder.build({
        code,
        language: language as any,
        filePath: file,
        workspaceId: params.workspaceId,
        repoId: params.repository.id
      });
      edges.push(...fileEdges);
    }

    return {
      chunks,
      edges,
      commit: currentCommit,
      languageStats
    };
  }
}
