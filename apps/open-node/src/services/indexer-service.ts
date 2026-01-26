import { CommonIndexer } from '@/indexers/common-indexer';
import { getLanguageFromExt } from '@/indexers/core/ast-parser';
import { GitRepository } from '../types';
import { getFileExtension } from '../utils/fs';
import { getRepoPath, GitService } from '../utils/git';
import logger from '../utils/logger';

export class IndexerService {
  private commonIndexer = new CommonIndexer();

  /**
   * 索引 Git 仓库
   */
  async indexRepository(params: { repository: GitRepository; workspaceId: string; mode: 'full' | 'incremental' }) {
    const repoPath = params.repository.localPath || getRepoPath(params.repository.id);
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
      const language = getLanguageFromExt(ext);
      if (!language) {
        continue;
      }
      languageStats[language] = (languageStats[language] || 0) + 1;
      const code = await git.readFile(file);
      const res = await this.commonIndexer.index({
        code,
        language,
        filePath: file,
        workspaceId: params.workspaceId,
        repoId: params.repository.id,
        repoName: params.repository.name,
        commit: currentCommit
      });
      chunks.push(...res.chunks);
      edges.push(...res.edges);
    }

    return {
      chunks,
      edges,
      commit: currentCommit,
      languageStats
    };
  }

  /**
   * Index a markdown content
   */
  async indexMarkdownFile() {}

  /**
   * Index a URL
   */
  async indexUrl() {}

  /**
   * Index a plain text content
   */
  async indexTxtFile() {}
}
