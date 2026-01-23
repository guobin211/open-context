import { describe, it, expect, beforeEach } from 'vitest';
import { GraphService } from '../../src/services/graph-service';

describe('GraphService', () => {
  let graphService: GraphService;

  beforeEach(() => {
    graphService = new GraphService();
  });

  describe('init', () => {
    it('should initialize the graph', async () => {
      await expect(graphService.init()).resolves.not.toThrow();
    });
  });

  describe('getDependencies', () => {
    it('should return dependencies for a symbol', () => {
      const result = graphService.getDependencies('test.symbol');
      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('edges');
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should filter by edge type', () => {
      const result = graphService.getDependencies('test.symbol', 'CALLS');
      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('edges');
    });
  });

  describe('getReverseDependencies', () => {
    it('should return reverse dependencies for a symbol', () => {
      const result = graphService.getReverseDependencies('test.symbol');
      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('edges');
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should filter by edge type', () => {
      const result = graphService.getReverseDependencies('test.symbol', 'IMPORTS');
      expect(result).toHaveProperty('from');
      expect(result).toHaveProperty('edges');
    });
  });

  describe('traverse', () => {
    it('should traverse the graph with specified depth', () => {
      const result = graphService.traverse('test.symbol', 2);
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });

    it('should handle depth 1', () => {
      const result = graphService.traverse('test.symbol', 1);
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
    });

    it('should filter by edge type during traversal', () => {
      const result = graphService.traverse('test.symbol', 2, 'CALLS');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
    });
  });
});
