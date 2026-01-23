import { getLevelDBInstance } from '../db';
import { EdgeType, DependencyResult, TraverseResult } from '../types';
import logger from '../utils/logger';

export class GraphService {
  public db = getLevelDBInstance();
  private out = new Map<string, Map<EdgeType, Set<string>>>();
  private in = new Map<string, Map<EdgeType, Set<string>>>();

  async init(): Promise<void> {
    logger.info('Loading graph from LevelDB');

    for await (const [key, value] of this.db.iterateEdges()) {
      const [from, type] = key.split(':') as [string, EdgeType];
      const tos = JSON.parse(value) as string[];

      if (!this.out.has(from)) {
        this.out.set(from, new Map());
      }
      this.out.get(from)!.set(type, new Set(tos));
    }

    for await (const [key, value] of this.db.iterateReverseEdges()) {
      const [to, type] = key.split(':') as [string, EdgeType];
      const froms = JSON.parse(value) as string[];

      if (!this.in.has(to)) {
        this.in.set(to, new Map());
      }
      this.in.get(to)!.set(type, new Set(froms));
    }

    logger.info({ nodes: this.out.size }, 'Graph loaded');
  }

  async addEdge(from: string, to: string, type: EdgeType): Promise<void> {
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

    const tos = Array.from(this.out.get(from)!.get(type)!);
    await this.db.putEdge(from, type, tos);

    const froms = Array.from(this.in.get(to)!.get(type)!);
    await this.db.putReverseEdge(to, type, froms);
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
    return this.db.getSymbol(symbolId);
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
}
