import { getSurrealDBInstance } from '../db/surreal';
import { EdgeType, DependencyResult, TraverseResult } from '../types';
import logger from '../utils/logger';

/**
 * 图服务 - 使用 SurrealDB 原生图查询
 */
export class GraphService {
  private surrealdb = getSurrealDBInstance();
  private out = new Map<string, Map<EdgeType, Set<string>>>();
  private in = new Map<string, Map<EdgeType, Set<string>>>();
  private isInitialized = false;

  async init(): Promise<void> {
    logger.info('Loading graph from SurrealDB');

    try {
      const edgeTypes: EdgeType[] = ['IMPORTS', 'CALLS', 'IMPLEMENTS', 'EXTENDS', 'USES', 'REFERENCES'];

      for (const edgeType of edgeTypes) {
        try {
          const result = await this.surrealdb['db'].query<
            [
              Array<{
                in: string;
                out: string;
              }>
            ]
          >(`SELECT in, out FROM ${edgeType}`);

          const edges = result[0] || [];

          for (const edge of edges) {
            const from = edge.out.replace('symbol:', '').replace(/`/g, '');
            const to = edge.in.replace('symbol:', '').replace(/`/g, '');

            if (!this.out.has(from)) {
              this.out.set(from, new Map());
            }
            if (!this.out.get(from)!.has(edgeType)) {
              this.out.get(from)!.set(edgeType, new Set());
            }
            this.out.get(from)!.get(edgeType)!.add(to);

            if (!this.in.has(to)) {
              this.in.set(to, new Map());
            }
            if (!this.in.get(to)!.has(edgeType)) {
              this.in.get(to)!.set(edgeType, new Set());
            }
            this.in.get(to)!.get(edgeType)!.add(from);
          }

          logger.debug({ edgeType, count: edges.length }, `Loaded edges for ${edgeType}`);
        } catch (edgeError) {
          logger.warn({ edgeType, error: edgeError }, `No edges found for ${edgeType}`);
        }
      }

      this.isInitialized = true;
      logger.info({ nodes: this.out.size, inNodes: this.in.size }, 'Graph loaded from SurrealDB');
    } catch (error) {
      logger.error({ error }, 'Failed to load graph from SurrealDB');
      throw error;
    }
  }

  async addEdge(from: string, to: string, type: EdgeType): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('GraphService is not initialized. Call init() before adding edges.');
    }
    if (!this.out.has(from)) {
      this.out.set(from, new Map());
    }
    if (!this.out.get(from)!.has(type)) {
      this.out.get(from)!.set(type, new Set());
    }
    this.out.get(from)!.get(type)!.add(to);

    if (!this.in.has(to)) {
      this.in.set(to, new Map());
    }
    if (!this.in.get(to)!.has(type)) {
      this.in.get(to)!.set(type, new Set());
    }
    this.in.get(to)!.get(type)!.add(from);

    await this.surrealdb.createEdge(from, to, type);
  }

  async batchAddEdges(edges: Array<{ from: string; to: string; type: EdgeType }>): Promise<void> {
    for (const edge of edges) {
      if (!this.out.has(edge.from)) {
        this.out.set(edge.from, new Map());
      }
      if (!this.out.get(edge.from)!.has(edge.type)) {
        this.out.get(edge.from)!.set(edge.type, new Set());
      }
      this.out.get(edge.from)!.get(edge.type)!.add(edge.to);

      if (!this.in.has(edge.to)) {
        this.in.set(edge.to, new Map());
      }
      if (!this.in.get(edge.to)!.has(edge.type)) {
        this.in.get(edge.to)!.set(edge.type, new Set());
      }
      this.in.get(edge.to)!.get(edge.type)!.add(edge.from);
    }

    await this.surrealdb.batchCreateEdges(edges);
  }

  getDependencies(symbolId: string, type?: EdgeType): DependencyResult {
    const edges: DependencyResult['edges'] = [];

    const outEdges = this.out.get(symbolId);
    if (outEdges) {
      for (const [edgeType, tos] of outEdges) {
        if (!type || edgeType === type) {
          for (const to of tos) {
            edges.push({ to, type: edgeType });
          }
        }
      }
    }

    return { from: symbolId, edges };
  }

  getReverseDependencies(symbolId: string, type?: EdgeType): DependencyResult {
    const edges: DependencyResult['edges'] = [];

    const inEdges = this.in.get(symbolId);
    if (inEdges) {
      for (const [edgeType, froms] of inEdges) {
        if (!type || edgeType === type) {
          for (const from of froms) {
            edges.push({ to: from, type: edgeType });
          }
        }
      }
    }

    return { from: symbolId, edges };
  }

  async getSymbol<T = any>(symbolId: string): Promise<T | null> {
    const symbol = await this.surrealdb.getSymbol(symbolId);
    return symbol as T | null;
  }

  traverse(start: string, depth: number, type?: EdgeType): TraverseResult {
    const nodes = new Set<string>([start]);
    const edges: TraverseResult['edges'] = [];
    const queue = [{ node: start, level: 0 }];

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;

      if (level >= depth) continue;

      const deps = this.getDependencies(node, type);
      for (const edge of deps.edges) {
        if (!nodes.has(edge.to)) {
          nodes.add(edge.to);
          queue.push({ node: edge.to, level: level + 1 });
        }
        edges.push({ from: node, to: edge.to, type: edge.type });
      }
    }

    return { nodes: Array.from(nodes), edges };
  }

  async queryGraphFromDB(symbolId: string, depth = 2, type?: EdgeType): Promise<TraverseResult> {
    try {
      const result = await this.surrealdb.queryGraph({
        symbolId,
        depth,
        edgeType: type,
        direction: 'outbound'
      });

      return {
        nodes: result.nodes,
        edges: result.edges
      };
    } catch (error) {
      logger.error({ error, symbolId }, 'Failed to query graph from DB');
      return { nodes: [symbolId], edges: [] };
    }
  }

  async searchRelated(options: {
    query: string;
    workspaceId: string;
  }): Promise<Array<{ symbolId: string; pathLength: number }>> {
    const results = await this.surrealdb.fullTextSearch({
      query: options.query,
      workspaceId: options.workspaceId,
      limit: 5
    });

    const related: Array<{ symbolId: string; pathLength: number }> = [];

    for (const result of results) {
      const deps = this.getDependencies(result.symbolId);
      related.push({
        symbolId: result.symbolId,
        pathLength: 0
      });

      for (const edge of deps.edges) {
        related.push({
          symbolId: edge.to,
          pathLength: 1
        });
      }
    }

    return related;
  }
}
