import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UrlIndexer } from '../../src/indexers/impl/url-indexer';

describe('UrlIndexer', () => {
  const indexer = new UrlIndexer();

  const baseParams = {
    workspaceId: 'ws-1',
    repoId: 'repo-1',
    repoName: 'test-repo',
    commit: 'main'
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('index', () => {
    it('should extract title, excerpt and content chunks', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Understanding AI Systems</title>
            <meta name="description" content="This is a comprehensive guide about artificial intelligence and machine learning systems.">
          </head>
          <body>
            <main>
              <article>
                <h1>Understanding AI Systems</h1>
                <div class="content">
                  <p>This is a comprehensive guide about artificial intelligence and machine learning systems. AI has revolutionized many industries over the past decade.</p>
                  <p>Machine learning algorithms can process large amounts of data efficiently and accurately. They learn patterns from historical data and apply them to new situations.</p>
                  <p>Deep learning is a subset of machine learning that uses neural networks with multiple layers. These networks can automatically learn hierarchical representations of data.</p>
                  <p>Modern AI systems combine multiple techniques including supervised learning, unsupervised learning, and reinforcement learning to solve complex problems.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/article',
        ...baseParams
      });

      expect(result.chunks.length).toBeGreaterThan(0);

      const titleChunk = result.chunks.find((c) => c.payload.symbol_name === 'title');
      expect(titleChunk).toBeDefined();
      expect(titleChunk?.payload.symbol_kind).toBe('heading');
      expect(titleChunk?.payload.importance).toBe(1.0);
      expect(titleChunk?.payload.code).toContain('AI');
    });

    it('should extract links and generate graph edges', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Article</title>
          </head>
          <body>
            <main>
              <article>
                <h1>Test Article</h1>
                <div class="content">
                  <p>This article contains important information about various topics. Check out <a href="https://example.com/related">this related article</a> for more details on the subject.</p>
                  <p>You can also refer to an <a href="https://external.com/guide">external guide</a> for additional resources and information about best practices.</p>
                  <p>Don't forget to explore the <a href="/local/page">local page</a> for more content on this website.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/article',
        ...baseParams
      });

      expect(result.edges.length).toBeGreaterThan(0);
      expect(result.edges.every((e) => e.type === 'REFERENCES')).toBe(true);
      expect(result.edges.every((e) => e.confidence === 0.8)).toBe(true);
      expect(result.edges.every((e) => e.from && e.to)).toBe(true);
    });

    it('should split long content into chunks', async () => {
      const longParagraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100);
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Long Article</title></head>
          <body>
            <main>
              <article>
                <h1>Long Article Title</h1>
                <div class="content">
                  <p>${longParagraph}</p>
                  <p>This is another paragraph with more content to ensure proper chunking behavior.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/long-article',
        ...baseParams
      });

      const contentChunks = result.chunks.filter((c) => c.payload.symbol_name.startsWith('chunk-'));
      expect(contentChunks.length).toBeGreaterThan(1);
    });

    it('should include URL context in embedding text', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Context Test</title></head>
          <body>
            <main>
              <article>
                <h1>Context Test Article</h1>
                <div class="content">
                  <p>This paragraph should include URL context in the embedding text for better search results. It contains meaningful information about the topic being discussed.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/context-test',
        ...baseParams
      });

      const contentChunk = result.chunks.find((c) => c.payload.symbol_name.startsWith('chunk-'));
      expect(contentChunk?.embeddingText).toContain('URL: https://example.com/context-test');
      expect(contentChunk?.embeddingText).toContain('Title: Context Test');
    });

    it('should calculate importance based on chunk position', async () => {
      const longParagraph = 'Content section with detailed information about the topic. '.repeat(200);
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Importance Test</title></head>
          <body>
            <main>
              <article>
                <h1>Importance Test Article</h1>
                <div class="content">
                  <p>${longParagraph}</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/importance',
        ...baseParams
      });

      const contentChunks = result.chunks
        .filter((c) => c.payload.symbol_name.startsWith('chunk-'))
        .sort((a, b) => {
          const aIndex = parseInt(a.payload.symbol_name.split('-')[1]);
          const bIndex = parseInt(b.payload.symbol_name.split('-')[1]);
          return aIndex - bIndex;
        });

      if (contentChunks.length > 1) {
        expect(contentChunks[0].payload.importance).toBeGreaterThanOrEqual(
          contentChunks[contentChunks.length - 1].payload.importance
        );
      }
    });

    it('should generate unique symbol ids', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Unique IDs Test</title></head>
          <body>
            <main>
              <article>
                <h1>Unique IDs Test Article</h1>
                <div class="content">
                  <p>First paragraph with sufficient content for indexing purposes and testing the uniqueness of generated symbol identifiers.</p>
                  <p>Second paragraph also with enough content to be indexed properly and verify that each chunk gets a unique identifier.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/unique-ids',
        ...baseParams
      });

      const ids = result.chunks.map((c) => c.symbolId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should set correct metadata in payload', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Metadata Test</title></head>
          <body>
            <main>
              <article>
                <h1>Metadata Test Article</h1>
                <div class="content">
                  <p>This paragraph tests whether all metadata fields are correctly set in the payload structure for proper indexing.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/metadata-test',
        ...baseParams
      });

      const chunk = result.chunks[0];
      expect(chunk.payload.workspace_id).toBe('ws-1');
      expect(chunk.payload.repo_id).toBe('repo-1');
      expect(chunk.payload.repo_name).toBe('test-repo');
      expect(chunk.payload.file_path).toBe('https://example.com/metadata-test');
      expect(chunk.payload.language).toBe('html');
      expect(chunk.payload.commit).toBe('main');
      expect(chunk.payload.exported).toBe(true);
      expect(chunk.payload.visibility).toBe('public');
      expect(chunk.payload.indexed_at).toBeDefined();
    });

    it('should throw error for invalid URL protocol', async () => {
      await expect(
        indexer.index({
          url: 'ftp://example.com/file',
          ...baseParams
        })
      ).rejects.toThrow('Invalid URL');
    });

    it('should throw error when fetch fails', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        indexer.index({
          url: 'https://example.com/not-found',
          ...baseParams
        })
      ).rejects.toThrow('HTTP 404');
    });

    it('should throw error when article cannot be parsed', async () => {
      const mockHtml = '<html><body></body></html>';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      await expect(
        indexer.index({
          url: 'https://example.com/empty',
          ...baseParams
        })
      ).rejects.toThrow('Failed to parse article content');
    });

    it('should handle relative URLs in links', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Link Test</title></head>
          <body>
            <main>
              <article>
                <h1>Link Test Article</h1>
                <div class="content">
                  <p>Check out this <a href="/relative/path">relative link</a> for more information about the topic.</p>
                  <p>You can also navigate to the <a href="../parent">parent path</a> to see related content.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/article',
        ...baseParams
      });

      const relativeEdge = result.edges.find((e) =>
        e.to.includes('https://example.com/relative/path')
      );
      expect(relativeEdge).toBeDefined();
    });

    it('should filter out non-http/https links', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Protocol Test</title></head>
          <body>
            <main>
              <article>
                <h1>Protocol Test Article</h1>
                <div class="content">
                  <p>You can send an email to <a href="mailto:test@example.com">us via email</a> for any questions.</p>
                  <p>Feel free to <a href="tel:+1234567890">call us by phone</a> during business hours.</p>
                  <p>Visit our <a href="https://example.com/valid">website for more information</a> about our services.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/protocols',
        ...baseParams
      });

      const mailtoEdge = result.edges.find((e) => e.to.includes('mailto:'));
      const telEdge = result.edges.find((e) => e.to.includes('tel:'));
      expect(mailtoEdge).toBeUndefined();
      expect(telEdge).toBeUndefined();

      const validEdge = result.edges.find((e) => e.to.includes('https://example.com/valid'));
      expect(validEdge).toBeDefined();
    });

    it('should filter out short chunks', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head><title>Short Content</title></head>
          <body>
            <main>
              <article>
                <h1>Short Content Article</h1>
                <div class="content">
                  <p>This is a much longer paragraph that should be indexed properly because it contains enough meaningful content for processing.</p>
                </div>
              </article>
            </main>
          </body>
        </html>
      `;

      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => mockHtml
      });

      const result = await indexer.index({
        url: 'https://example.com/short',
        ...baseParams
      });

      const shortContentChunk = result.chunks.find(
        (c) => c.payload.symbol_name.startsWith('chunk-') && c.payload.code.length < 50
      );
      expect(shortContentChunk).toBeUndefined();
    });
  });
});
