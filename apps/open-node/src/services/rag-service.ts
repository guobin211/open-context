import { VectorService } from './vector-service';
import { GraphService } from './graph-service';
import { CodeQueryOptions, CodeQueryResult } from '../types';
import logger from '../utils/logger';

export class RAGService {
  private vectorService = new VectorService();
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
}
