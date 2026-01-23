import { getQdrantInstance } from '../db';
import { VectorSearchOptions, VectorSearchResult } from '../types';
import { generateEmbedding } from '../utils/vector';
import logger from '../utils/logger';

export class VectorService {
  private qdrant = getQdrantInstance();

  async search(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    logger.info({ query: options.query }, 'Searching vectors');

    const queryVector = await generateEmbedding(options.query);

    const results = await this.qdrant.search({
      vector: queryVector,
      workspaceId: options.workspaceId,
      limit: options.topK,
      filters: options.filters
    });

    return results.map((r) => ({
      symbolId: r.payload!.symbol_id as string,
      repo: r.payload!.repo_name as string,
      file: r.payload!.file_path as string,
      score: r.score,
      code: r.payload!.code as string,
      signature: r.payload!.signature as string | undefined,
      kind: r.payload!.symbol_kind as string
    }));
  }
}
