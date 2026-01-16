import { IndexerService, RepoService, JobService, GraphService } from '../services';
import { getQdrantInstance } from '../db';
import { batchGenerateEmbeddings } from '../utils/vector';
import logger from '../utils/logger';

export class IndexJob {
  private indexerService = new IndexerService();
  private repoService = new RepoService();
  private jobService = new JobService();
  private graphService: GraphService;
  private qdrant = getQdrantInstance();

  constructor(graphService: GraphService) {
    this.graphService = graphService;
  }

  async execute(params: {
    jobId: string;
    repoId: string;
    workspaceId: string;
    mode: 'full' | 'incremental';
  }): Promise<void> {
    try {
      await this.jobService.updateJobStatus(params.jobId, 'running', 0);

      const repository = await this.repoService.getRepo(params.repoId);
      if (!repository) {
        throw new Error(`Repository ${params.repoId} not found`);
      }

      logger.info({ repoId: params.repoId }, 'Starting index job');

      const result = await this.indexerService.indexRepository({
        repository,
        workspaceId: params.workspaceId,
        mode: params.mode
      });

      await this.jobService.updateJobStatus(params.jobId, 'running', 0.3);

      const embeddingTexts = result.chunks.map((c) => c.embeddingText);
      const embeddings = await batchGenerateEmbeddings(embeddingTexts);

      await this.jobService.updateJobStatus(params.jobId, 'running', 0.6);

      // 批量存入 Qdrant
      const points = result.chunks.map((chunk, i) => ({
        symbolId: chunk.symbolId,
        vector: embeddings[i],
        payload: chunk.payload
      }));
      await this.qdrant.batchUpsertSymbols(points);

      // 批量存入 LevelDB (Symbol 原始数据)
      const symbolEntries = result.chunks.map((chunk) => ({
        key: `symbol:${chunk.symbolId}`,
        value: {
          ...chunk.payload,
          id: chunk.symbolId,
          qualifiedName: chunk.payload.symbol_name, // 对应 Symbol 类型的 qualifiedName
          location: { startLine: 0, endLine: 0 }, // 占位，Extractor 需进一步完善
          codeChunk: chunk.payload.code,
          indexedAt: chunk.payload.indexed_at
        }
      }));
      await this.graphService.db.batchPut(symbolEntries);

      await this.jobService.updateJobStatus(params.jobId, 'running', 0.8);

      // 批量存入图边
      if (result.edges.length > 0) {
        for (const edge of result.edges) {
          await this.graphService.addEdge(edge.from, edge.to, edge.type);
        }
      }

      await this.repoService.updateIndexStatus(params.repoId, result.commit, result.languageStats);

      await this.jobService.updateJobStatus(params.jobId, 'completed', 1.0);

      logger.info({ repoId: params.repoId, jobId: params.jobId }, 'Index job completed');
    } catch (error: any) {
      logger.error({ error, jobId: params.jobId }, 'Index job failed');
      await this.jobService.updateJobStatus(params.jobId, 'failed', undefined, error.message);
      throw error;
    }
  }
}
