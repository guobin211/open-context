import { getSurrealDBInstance, FullTextSearchOptions, FullTextSearchResult } from '../db/surrealdb-client';
import logger from '../utils/logger';

export interface FullTextServiceSearchOptions {
  query: string;
  workspaceId: string;
  limit?: number;
  filters?: {
    repoIds?: string[];
    language?: string;
    symbolKinds?: string[];
  };
}

/**
 * 全文检索服务
 */
export class FullTextService {
  private surrealdb = getSurrealDBInstance();

  /**
   * 执行全文搜索
   */
  async search(options: FullTextServiceSearchOptions): Promise<FullTextSearchResult[]> {
    logger.info({ query: options.query, workspaceId: options.workspaceId }, 'Performing full-text search');

    const searchOptions: FullTextSearchOptions = {
      query: options.query,
      workspaceId: options.workspaceId,
      limit: options.limit || 10,
      filters: options.filters
    };

    const results = await this.surrealdb.fullTextSearch(searchOptions);

    logger.info({ count: results.length }, 'Full-text search completed');

    return results;
  }

  /**
   * 搜索符号名称
   */
  async searchSymbolName(symbolName: string, workspaceId: string, limit = 10): Promise<FullTextSearchResult[]> {
    return this.search({
      query: symbolName,
      workspaceId,
      limit
    });
  }

  /**
   * 搜索代码内容
   */
  async searchCode(codeQuery: string, workspaceId: string, limit = 10): Promise<FullTextSearchResult[]> {
    return this.search({
      query: codeQuery,
      workspaceId,
      limit
    });
  }

  /**
   * 按仓库搜索
   */
  async searchInRepo(query: string, workspaceId: string, repoId: string, limit = 10): Promise<FullTextSearchResult[]> {
    return this.search({
      query,
      workspaceId,
      limit,
      filters: {
        repoIds: [repoId]
      }
    });
  }

  /**
   * 按语言搜索
   */
  async searchByLanguage(
    query: string,
    workspaceId: string,
    language: string,
    limit = 10
  ): Promise<FullTextSearchResult[]> {
    return this.search({
      query,
      workspaceId,
      limit,
      filters: {
        language
      }
    });
  }
}
