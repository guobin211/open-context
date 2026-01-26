import type { GraphEdge } from '@/indexers/core/code-graph-builder';
import type { SymbolPayload, Visibility } from '@/types';
import { generateSymbolId } from '@/utils';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

export interface TextChunk {
  symbolId: string;
  embeddingText: string;
  payload: SymbolPayload;
}

export interface UrlIndexResult {
  chunks: TextChunk[];
  edges: GraphEdge[];
}

interface UrlIndexParams {
  url: string;
  workspaceId: string;
  repoId: string;
  repoName: string;
  commit: string;
}

/**
 * Indexes for URL.
 * 1、提取完整的文本内容
 * 2、文档分块
 * 3、检索外部链接，生成图谱边
 * 4、使用url链接作为filePath
 */
export class UrlIndexer {
  private textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '。', '！', '？', '.', '!', '?', ' ', '']
  });

  async index(params: UrlIndexParams): Promise<UrlIndexResult> {
    const { url } = params;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL: must start with http:// or https://');
    }

    try {
      const html = await this.fetchHtml(url);
      const dom = new JSDOM(html, { url });
      const reader = new Readability(dom.window.document);
      const article = reader.parse();

      if (!article || !article.title || !article.textContent) {
        throw new Error('Failed to parse article content');
      }

      const edges = this.extractLinks(dom, url, params);
      const chunks = await this.buildChunks(
        {
          title: article.title,
          textContent: article.textContent,
          excerpt: article.excerpt || undefined
        },
        params
      );

      return { chunks, edges };
    } catch (error) {
      throw new Error(`Failed to index URL: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OpenContext/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text();
  }

  private extractLinks(dom: JSDOM, sourceUrl: string, params: UrlIndexParams): GraphEdge[] {
    const edges: GraphEdge[] = [];
    const links = dom.window.document.querySelectorAll('a[href]');

    for (const link of Array.from(links)) {
      const href = link.getAttribute('href');
      if (!href) continue;

      try {
        const targetUrl = new URL(href, sourceUrl);

        if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
          continue;
        }

        edges.push({
          from: this.generateDocumentSymbolId(sourceUrl, params),
          to: this.generateDocumentSymbolId(targetUrl.href, params),
          type: 'REFERENCES',
          confidence: 0.8
        });
      } catch (e) {
        continue;
      }
    }

    return edges;
  }

  private async buildChunks(
    article: { title: string; textContent: string; excerpt?: string },
    params: UrlIndexParams
  ): Promise<TextChunk[]> {
    const { url, workspaceId, repoId, repoName, commit } = params;
    const chunks: TextChunk[] = [];

    const titleChunk = this.createTitleChunk(article.title, params);
    chunks.push(titleChunk);

    if (article.excerpt) {
      const excerptChunk = this.createExcerptChunk(article.excerpt, params);
      chunks.push(excerptChunk);
    }

    const textChunks = await this.textSplitter.splitText(article.textContent);
    for (let i = 0; i < textChunks.length; i++) {
      const chunkText = textChunks[i].trim();
      if (chunkText.length < 50) continue;

      const symbolName = `chunk-${i}`;
      const symbolId = generateSymbolId({
        workspaceId,
        repoId,
        filePath: url,
        symbolName
      });

      const embeddingText = this.prepareEmbeddingText(chunkText, {
        url,
        title: article.title,
        chunkIndex: i,
        totalChunks: textChunks.length
      });

      const payload: SymbolPayload = {
        workspace_id: workspaceId,
        repo_id: repoId,
        repo_name: repoName,
        file_path: url,
        language: 'html',
        symbol_id: symbolId,
        symbol_name: symbolName,
        symbol_kind: 'paragraph',
        exported: true,
        visibility: 'public' as Visibility,
        code: chunkText,
        signature: `${article.title} - Part ${i + 1}`,
        importance: this.calculateChunkImportance(i, textChunks.length),
        commit,
        indexed_at: Date.now()
      };

      chunks.push({ symbolId, embeddingText, payload });
    }

    return chunks;
  }

  private createTitleChunk(title: string, params: UrlIndexParams): TextChunk {
    const { url, workspaceId, repoId, repoName, commit } = params;
    const symbolName = 'title';
    const symbolId = generateSymbolId({
      workspaceId,
      repoId,
      filePath: url,
      symbolName
    });

    const embeddingText = `Document Title: ${title}\nURL: ${url}`;

    const payload: SymbolPayload = {
      workspace_id: workspaceId,
      repo_id: repoId,
      repo_name: repoName,
      file_path: url,
      language: 'html',
      symbol_id: symbolId,
      symbol_name: symbolName,
      symbol_kind: 'heading',
      exported: true,
      visibility: 'public' as Visibility,
      code: title,
      signature: title,
      importance: 1.0,
      commit,
      indexed_at: Date.now()
    };

    return { symbolId, embeddingText, payload };
  }

  private createExcerptChunk(excerpt: string, params: UrlIndexParams): TextChunk {
    const { url, workspaceId, repoId, repoName, commit } = params;
    const symbolName = 'excerpt';
    const symbolId = generateSymbolId({
      workspaceId,
      repoId,
      filePath: url,
      symbolName
    });

    const embeddingText = `Summary: ${excerpt}\nURL: ${url}`;

    const payload: SymbolPayload = {
      workspace_id: workspaceId,
      repo_id: repoId,
      repo_name: repoName,
      file_path: url,
      language: 'html',
      symbol_id: symbolId,
      symbol_name: symbolName,
      symbol_kind: 'paragraph',
      exported: true,
      visibility: 'public' as Visibility,
      code: excerpt,
      signature: 'Document Summary',
      importance: 0.9,
      commit,
      indexed_at: Date.now()
    };

    return { symbolId, embeddingText, payload };
  }

  private prepareEmbeddingText(
    content: string,
    context: {
      url: string;
      title: string;
      chunkIndex: number;
      totalChunks: number;
    }
  ): string {
    const parts: string[] = [];

    parts.push(`URL: ${context.url}`);
    parts.push(`Title: ${context.title}`);
    parts.push(`Part ${context.chunkIndex + 1} of ${context.totalChunks}`);
    parts.push('');
    parts.push(content);

    return parts.join('\n');
  }

  private calculateChunkImportance(chunkIndex: number, totalChunks: number): number {
    if (totalChunks === 1) return 0.8;

    if (chunkIndex === 0) return 0.85;

    if (chunkIndex < totalChunks * 0.3) return 0.7;

    if (chunkIndex < totalChunks * 0.7) return 0.6;

    return 0.5;
  }

  private generateDocumentSymbolId(url: string, params: UrlIndexParams): string {
    return generateSymbolId({
      workspaceId: params.workspaceId,
      repoId: params.repoId,
      filePath: url,
      symbolName: 'document'
    });
  }
}
