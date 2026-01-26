import { describe, it, expect } from 'vitest';
import { MarkdownIndexer } from '../../src/indexers/impl/markdown-indexer';

describe('MarkdownIndexer', () => {
  const indexer = new MarkdownIndexer();

  const baseParams = {
    workspaceId: 'ws-1',
    repoId: 'repo-1',
    repoName: 'test-repo',
    commit: 'main'
  };

  describe('index', () => {
    it('should extract headings from markdown', () => {
      const code = `# Main Title

## Section 1

Content under section 1.

## Section 2

Content under section 2.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/readme.md',
        ...baseParams
      });

      const headings = chunks.filter((c) => c.payload.symbol_kind === 'heading');
      expect(headings.length).toBe(3);
      expect(headings[0].payload.symbol_name).toContain('h1-main-title');
      expect(headings[1].payload.symbol_name).toContain('h2-section-1');
    });

    it('should extract code blocks with language info', () => {
      const code = `# Code Example

\`\`\`typescript
function hello() {
  console.log('Hello');
}
\`\`\`

\`\`\`python
def hello():
    print("Hello")
\`\`\``;

      const chunks = indexer.index({
        code,
        filePath: 'docs/examples.md',
        ...baseParams
      });

      const codeBlocks = chunks.filter((c) => c.payload.symbol_kind === 'code-block');
      expect(codeBlocks.length).toBe(2);
      expect(codeBlocks[0].embeddingText).toContain('typescript');
      expect(codeBlocks[1].embeddingText).toContain('python');
    });

    it('should extract paragraphs with sufficient length', () => {
      const code = `# Document

Short text.

This is a longer paragraph that contains enough content to be indexed properly for vector search.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/content.md',
        ...baseParams
      });

      const paragraphs = chunks.filter((c) => c.payload.symbol_kind === 'paragraph');
      // 短段落应该被过滤掉
      expect(paragraphs.length).toBe(1);
      expect(paragraphs[0].payload.code).toContain('longer paragraph');
    });

    it('should include file path in embedding text', () => {
      const code = `# Title

Some paragraph content that is long enough to be indexed.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/guide.md',
        ...baseParams
      });

      expect(chunks[0].embeddingText).toContain('File: docs/guide.md');
    });

    it('should include section context for paragraphs', () => {
      const code = `# Getting Started

This paragraph explains how to get started with the project setup.

## Installation

This paragraph describes the installation process in detail.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/guide.md',
        ...baseParams
      });

      const paragraphs = chunks.filter((c) => c.payload.symbol_kind === 'paragraph');
      // 第二个段落应该包含 "Installation" 的上下文
      const installParagraph = paragraphs.find((p) => p.payload.code.includes('installation'));
      expect(installParagraph?.embeddingText).toContain('Section: Installation');
    });

    it('should generate unique symbol ids', () => {
      const code = `# Title

Paragraph 1 content that is long enough.

Paragraph 2 content that is also long enough.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/test.md',
        ...baseParams
      });

      const ids = chunks.map((c) => c.symbolId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should calculate importance scores correctly', () => {
      const code = `# Main Heading

## Sub Heading

### Sub Sub Heading

\`\`\`javascript
const x = 1;
\`\`\`

Regular paragraph content that is long enough.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/test.md',
        ...baseParams
      });

      const h1 = chunks.find((c) => c.payload.symbol_name.includes('h1'));
      const h2 = chunks.find((c) => c.payload.symbol_name.includes('h2'));
      const h3 = chunks.find((c) => c.payload.symbol_name.includes('h3'));
      const codeBlock = chunks.find((c) => c.payload.symbol_kind === 'code-block');

      // 一级标题权重最高
      expect(h1!.payload.importance).toBeGreaterThan(h2!.payload.importance);
      expect(h2!.payload.importance).toBeGreaterThan(h3!.payload.importance);
      // 代码块权重较高
      expect(codeBlock!.payload.importance).toBe(0.8);
    });

    it('should handle empty markdown', () => {
      const code = '';

      const chunks = indexer.index({
        code,
        filePath: 'docs/empty.md',
        ...baseParams
      });

      expect(chunks.length).toBe(0);
    });

    it('should handle markdown with only short content', () => {
      const code = `# Hi

Ok.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/short.md',
        ...baseParams
      });

      // 只有标题会被索引，短段落被过滤
      expect(chunks.length).toBe(1);
      expect(chunks[0].payload.symbol_kind).toBe('heading');
    });

    it('should extract lists', () => {
      const code = `# Features

- Feature one is really useful
- Feature two is also great
- Feature three completes the set`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/features.md',
        ...baseParams
      });

      const lists = chunks.filter((c) => c.payload.symbol_kind === 'paragraph');
      expect(lists.length).toBe(1);
    });

    it('should set correct metadata in payload', () => {
      const code = `# Test Document

This is a test paragraph with enough content for indexing.`;

      const chunks = indexer.index({
        code,
        filePath: 'docs/test.md',
        ...baseParams
      });

      const chunk = chunks[0];
      expect(chunk.payload.workspace_id).toBe('ws-1');
      expect(chunk.payload.repo_id).toBe('repo-1');
      expect(chunk.payload.repo_name).toBe('test-repo');
      expect(chunk.payload.file_path).toBe('docs/test.md');
      expect(chunk.payload.language).toBe('markdown');
      expect(chunk.payload.commit).toBe('main');
      expect(chunk.payload.exported).toBe(true);
      expect(chunk.payload.visibility).toBe('public');
      expect(chunk.payload.indexed_at).toBeDefined();
    });
  });
});
