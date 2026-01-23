import { QdrantClient } from '@qdrant/js-client-rest';
import { SymbolPayload } from '../types';
import logger from '../utils/logger';

const COLLECTION_NAME = 'code_symbols';
const VECTOR_SIZE = parseInt(process.env.VECTOR_SIZE || '1024', 10);

export class QdrantService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY
    });
  }

  async init(): Promise<void> {
    try {
      await this.client.getCollection(COLLECTION_NAME);
      logger.info({ collection: COLLECTION_NAME }, 'Qdrant collection exists');
    } catch (error) {
      logger.error({ collection: COLLECTION_NAME }, `Creating Qdrant collection error: ${error}`);
      await this.client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine'
        }
      });

      await this.createPayloadIndexes();
    }
  }

  private async createPayloadIndexes(): Promise<void> {
    const indexes: Array<{ field_name: string; field_schema: 'keyword' | 'bool' }> = [
      { field_name: 'workspace_id', field_schema: 'keyword' },
      { field_name: 'repo_id', field_schema: 'keyword' },
      { field_name: 'symbol_kind', field_schema: 'keyword' },
      { field_name: 'exported', field_schema: 'bool' },
      { field_name: 'language', field_schema: 'keyword' }
    ];

    for (const index of indexes) {
      await this.client.createPayloadIndex(COLLECTION_NAME, index);
    }

    logger.info('Payload indexes created');
  }

  async upsertSymbol(symbolId: string, vector: number[], payload: SymbolPayload): Promise<void> {
    await this.client.upsert(COLLECTION_NAME, {
      points: [
        {
          id: symbolId,
          vector,
          payload: payload as any
        }
      ]
    });
  }

  async batchUpsertSymbols(
    points: Array<{
      symbolId: string;
      vector: number[];
      payload: SymbolPayload;
    }>
  ): Promise<void> {
    await this.client.upsert(COLLECTION_NAME, {
      points: points.map((p) => ({
        id: p.symbolId,
        vector: p.vector,
        payload: p.payload as any
      }))
    });
  }

  async search(params: {
    vector: number[];
    workspaceId: string;
    limit?: number;
    filters?: {
      repoIds?: string[];
      symbolKinds?: string[];
      exported?: boolean;
      language?: string;
    };
  }) {
    const filter: any = {
      must: [{ key: 'workspace_id', match: { value: params.workspaceId } }]
    };

    if (params.filters?.repoIds && params.filters.repoIds.length > 0) {
      filter.must.push({
        key: 'repo_id',
        match: { any: params.filters.repoIds }
      });
    }

    if (params.filters?.symbolKinds && params.filters.symbolKinds.length > 0) {
      filter.must.push({
        key: 'symbol_kind',
        match: { any: params.filters.symbolKinds }
      });
    }

    if (params.filters?.exported !== undefined) {
      filter.must.push({
        key: 'exported',
        match: { value: params.filters.exported }
      });
    }

    if (params.filters?.language) {
      filter.must.push({
        key: 'language',
        match: { value: params.filters.language }
      });
    }

    const result = await this.client.search(COLLECTION_NAME, {
      vector: params.vector,
      limit: params.limit || 10,
      filter,
      with_payload: true
    });

    return result;
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'repo_id', match: { value: repoId } }]
      }
    });
    logger.info({ repoId }, 'Deleted vectors for repo');
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      filter: {
        must: [{ key: 'workspace_id', match: { value: workspaceId } }]
      }
    });
    logger.info({ workspaceId }, 'Deleted vectors for workspace');
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      points: [symbolId]
    });
  }
}

let instance: QdrantService | null = null;

export function getQdrantInstance(): QdrantService {
  if (!instance) {
    instance = new QdrantService();
  }
  return instance;
}
