import { describe, it, expect } from 'vitest';
import { ASTParser, SymbolExtractor } from '../../src/indexers/code-symbol-extractor.ts';
import { CodeChunkBuilder } from '../../src/indexers/code-chunk-builder';
import { GraphBuilder } from '../../src/indexers/code-graph-builder';

describe('Indexers', () => {
  describe('Symbol Extractor', () => {
    const parser = new ASTParser();
    const extractor = new SymbolExtractor(parser);

    it('should extract function declarations', () => {
      const code = `
        function testFunction(a: number): string {
          return 'test';
        }
      `;
      const symbols = extractor.extract(code, 'ts', 'test.ts');

      expect(symbols).toMatchSnapshot();

      const func = symbols.find((s) => s.name === 'testFunction');
      expect(func).toBeDefined();
      expect(func?.kind).toBe('function');
      expect(func?.signature).toContain('function testFunction');
    });

    it('should extract class declarations', () => {
      const code = `
        class TestClass {
          constructor() {}
          testMethod() {}
        }
      `;
      const symbols = extractor.extract(code, 'ts', 'test.ts');

      expect(symbols).toMatchSnapshot();

      const cls = symbols.find((s) => s.name === 'TestClass');
      const method = symbols.find((s) => s.name === 'testMethod');

      expect(cls).toBeDefined();
      expect(cls?.kind).toBe('class');
      expect(method).toBeDefined();
      expect(method?.kind).toBe('method');
      expect(method?.qualifiedName).toBe('TestClass.testMethod');
    });

    it('should extract arrow functions', () => {
      const code = `
        const arrowFunc = (x: number) => x * 2;
      `;
      const symbols = extractor.extract(code, 'ts', 'test.ts');
      expect(symbols).toMatchSnapshot();
      const func = symbols.find((s) => s.name === 'arrowFunc');

      expect(func).toBeDefined();
      expect(func?.kind).toBe('function');
    });

    it('should extract export statements', () => {
      const code = `
        export function exportedFunc() {}
        export default class DefaultClass {}
      `;
      const symbols = extractor.extract(code, 'ts', 'test.ts');
      expect(symbols).toMatchSnapshot();
      const func = symbols.find((s) => s.name === 'exportedFunc');
      const cls = symbols.find((s) => s.name === 'DefaultClass');

      expect(func?.exported).toBe(true);
      expect(cls?.exported).toBe(true);
    });
  });

  describe('Code Chunk Builder', () => {
    const builder = new CodeChunkBuilder();
    it('should create chunks from extracted symbols', () => {
      const symbols = [
        {
          name: 'func1',
          qualifiedName: 'func1',
          kind: 'function' as any,
          visibility: 'public' as any,
          exported: true,
          location: { startLine: 1, endLine: 3 },
          signature: 'function func1()',
          codeChunk: 'function func1() {\n  return 1;\n}'
        }
      ];

      const chunks = builder.build({
        workspaceId: 'ws1',
        repoId: 'repo1',
        repoName: 'test-repo',
        filePath: 'src/index.ts',
        language: 'typescript',
        commit: 'main',
        symbols
      });

      expect(chunks).toMatchSnapshot();
      expect(chunks).toHaveLength(1);
      expect(chunks[0].symbolId).toBeDefined();
      expect(chunks[0].payload.symbol_name).toBe('func1');
      expect(chunks[0].payload.importance).toBeGreaterThan(0.5);
    });
  });

  describe('Graph Builder', () => {
    const parser = new ASTParser();
    const builder = new GraphBuilder(parser);
    it('should build dependency graph from code', () => {
      const code = `
        import { other } from './other';
        class Main {
          run() {
            other();
            this.helper();
          }
          helper() {}
        }
      `;

      const edges = builder.build({
        code,
        language: 'ts',
        filePath: 'src/main.ts',
        workspaceId: 'ws1',
        repoId: 'repo1'
      });

      expect(edges).toMatchSnapshot();

      // Should have an import edge
      const importEdge = edges.find((e) => e.type === 'IMPORTS');
      expect(importEdge).toBeDefined();
      expect(importEdge?.to).toBe('./other');

      // Should have a call edge to 'other'
      const callOther = edges.find((e) => e.type === 'CALLS' && e.to === 'other');
      expect(callOther).toBeDefined();

      // Should have a call edge to 'Main.helper' (resolved from this.helper)
      const callHelper = edges.find((e) => e.type === 'CALLS' && e.to === 'Main.helper');
      expect(callHelper).toBeDefined();
    });
  });
});
