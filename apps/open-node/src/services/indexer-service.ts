import { GitService, getRepoPath } from '../utils/git';
import { getFileExtension } from '../utils/fs';
import { Repository } from '../types';
import logger from '../utils/logger';
import { FileIndexer } from '@/indexers/file-indexer';
import { extensionMapping } from '@/indexers';

export class IndexerService {
  private fileIndexer = new FileIndexer();

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
      const language = extensionMapping[ext];
      if (!language) {
        continue;
      }
      languageStats[language] = (languageStats[language] || 0) + 1;
      const code = await git.readFile(file);
      const res = await this.fileIndexer.index({
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

  async indexMarkdown() {}

  async indexUrl() {}

  async indexTxt() {}
}
