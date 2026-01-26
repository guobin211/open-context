import { VectorService } from './vector-service';
import { GraphService } from './graph-service';
import { FullTextService } from './fulltext-service';
import { CodeQueryOptions, CodeQueryResult } from '../types';
import logger from '../utils/logger';

export interface HybridSearchWeights {
  vector?: number;
  fulltext?: number;
  graph?: number;
}

export interface HybridSearchOptions extends CodeQueryOptions {
  weights?: HybridSearchWeights;
}

export interface HybridSearchResult extends CodeQueryResult {
  hybridScore: number;
  scores: {
    vector?: number;
    fulltext?: number;
    graph?: number;
  };
}

export class RAGService {
  private vectorService = new VectorService();
  private fulltextService = new FullTextService();
  private graphService: GraphService;

  constructor(graphService: GraphService) {
    this.graphService = graphService;
  }

  async query(options: CodeQueryOptions): Promise<CodeQueryResult[]> {
    logger.info({ query: options.query }, 'RAG query');

    const vectorResults = await this.vectorService.search(options);

    if (!options.expandGraph) {
      return vectorResults.map((r) => ({ ...r, dependencies: [] }));
    }

    const results: CodeQueryResult[] = [];

    for (const result of vectorResults) {
      const deps = this.graphService.getDependencies(result.symbolId, options.expandGraph.type as any);

      const dependencies = await Promise.all(
        deps.edges.slice(0, 5).map(async (edge) => {
          const symbol = await this.graphService.getSymbol(edge.to);
          return {
            symbolId: edge.to,
            code: symbol?.codeChunk || '',
            type: edge.type
          };
        })
      );

      results.push({
        ...result,
        dependencies
      });
    }

    return results;
  }

  /**
   * 混合查询：向量 + 全文 + 图
   */
  async hybridSearch(options: HybridSearchOptions): Promise<HybridSearchResult[]> {
    logger.info({ query: options.query, weights: options.weights }, 'Hybrid search');

    // 默认权重：向量 60%, 全文 30%, 图 10%
    const weights = {
      vector: options.weights?.vector ?? 0.6,
      fulltext: options.weights?.fulltext ?? 0.3,
      graph: options.weights?.graph ?? 0.1
    };

    // 归一化权重
    const total = weights.vector + weights.fulltext + weights.graph;
    const normalizedWeights = {
      vector: weights.vector / total,
      fulltext: weights.fulltext / total,
      graph: weights.graph / total
    };

    logger.debug({ normalizedWeights }, 'Normalized weights');

    // 并行执行三种查询
    const [vectorResults, fulltextResults, graphResults] = await Promise.all([
      weights.vector > 0
        ? this.vectorService.search(options).catch((err) => {
            logger.error({ err }, 'Vector search failed');
            return [];
          })
        : Promise.resolve([]),
      weights.fulltext > 0
        ? this.fulltextService
            .search({
              query: options.query,
              workspaceId: options.workspaceId,
              limit: options.topK,
              filters: options.filters
            })
            .catch((err) => {
              logger.error({ err }, 'Fulltext search failed');
              return [];
            })
        : Promise.resolve([]),
      weights.graph > 0
        ? this.graphService
            .searchRelated({
              query: options.query,
              workspaceId: options.workspaceId
            })
            .catch((err) => {
              logger.error({ err }, 'Graph search failed');
              return [];
            })
        : Promise.resolve([])
    ]);

    // 合并结果并计算加权分数
    const merged = this.mergeResults(vectorResults, fulltextResults, graphResults, normalizedWeights);

    // 取 top-K
    const topResults = merged.slice(0, options.topK || 10);

    logger.info({ count: topResults.length }, 'Hybrid search completed');

    return topResults;
  }

  /**
   * 合并并排序结果
   */
  private mergeResults(
    vectorResults: any[],
    fulltextResults: any[],
    graphResults: any[],
    weights: { vector: number; fulltext: number; graph: number }
  ): HybridSearchResult[] {
    const scoreMap = new Map<
      string,
      {
        symbolId: string;
        scores: { vector?: number; fulltext?: number; graph?: number };
        data: any;
      }
    >();

    // 处理向量搜索结果（分数已经是 0-1）
    for (const result of vectorResults) {
      const symbolId = result.symbolId;

      if (!scoreMap.has(symbolId)) {
        scoreMap.set(symbolId, {
          symbolId,
          scores: { vector: result.score },
          data: result
        });
      } else {
        const entry = scoreMap.get(symbolId)!;
        entry.scores.vector = result.score;
      }
    }

    // 处理全文搜索结果（BM25 分数归一化到 0-1）
    const maxBM25 = Math.max(...fulltextResults.map((r) => r.bm25Score || 0), 1);
    for (const result of fulltextResults) {
      const symbolId = result.symbolId;
      const normalizedScore = (result.bm25Score || 0) / maxBM25;

      if (!scoreMap.has(symbolId)) {
        scoreMap.set(symbolId, {
          symbolId,
          scores: { fulltext: normalizedScore },
          data: {
            symbolId: result.symbolId,
            repo: '',
            file: result.filePath,
            score: 0,
            code: result.code,
            signature: '',
            kind: ''
          }
        });
      } else {
        const entry = scoreMap.get(symbolId)!;
        entry.scores.fulltext = normalizedScore;
      }
    }

    // 处理图搜索结果（根据路径长度归一化）
    for (const result of graphResults) {
      const symbolId = result.symbolId;
      const normalizedScore = 1 / (result.pathLength + 1);

      if (!scoreMap.has(symbolId)) {
        scoreMap.set(symbolId, {
          symbolId,
          scores: { graph: normalizedScore },
          data: {
            symbolId: result.symbolId,
            repo: '',
            file: '',
            score: 0,
            code: '',
            signature: '',
            kind: ''
          }
        });
      } else {
        const entry = scoreMap.get(symbolId)!;
        entry.scores.graph = normalizedScore;
      }
    }

    // 计算加权总分并排序
    const results: HybridSearchResult[] = [];
    for (const entry of scoreMap.values()) {
      const { vector = 0, fulltext = 0, graph = 0 } = entry.scores;
      const hybridScore = vector * weights.vector + fulltext * weights.fulltext + graph * weights.graph;

      results.push({
        ...entry.data,
        hybridScore,
        scores: entry.scores,
        dependencies: []
      });
    }

    // 按加权总分降序排序
    results.sort((a, b) => b.hybridScore - a.hybridScore);

    return results;
  }
}
