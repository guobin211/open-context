import type { RootContent, Heading, Code, Paragraph, List } from 'mdast';
import { remark } from 'remark';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import { generateSymbolId } from '../utils';
import type { SymbolKind, Visibility, SymbolPayload } from '../types';

/**
 * Markdown 文档块
 */
export interface MarkdownChunk {
  symbolId: string;
  embeddingText: string;
  payload: SymbolPayload;
}

/**
 * Markdown 段落信息
 */
interface MarkdownSection {
  type: 'heading' | 'paragraph' | 'code-block' | 'list';
  level?: number;
  title?: string;
  content: string;
  startLine: number;
  endLine: number;
  language?: string;
}

const processor = remark().use(remarkGfm).use(remarkMdx);

/**
 * Markdown 索引器
 */
export class MarkdownIndexer {
  /**
   * 索引 Markdown 文件
   */
  index(params: {
    code: string;
    filePath: string;
    workspaceId: string;
    repoId: string;
    repoName: string;
    commit: string;
  }): MarkdownChunk[] {
    const sections = this.extractSections(params.code);
    return this.buildChunks(sections, params);
  }

  /**
   * 提取 Markdown 文档的各个段落
   */
  private extractSections(code: string): MarkdownSection[] {
    const ast = processor.parse(code);
    const sections: MarkdownSection[] = [];
    let currentHeading: { title: string; level: number } | null = null;

    for (const node of ast.children) {
      const section = this.nodeToSection(node, code, currentHeading);
      if (section) {
        sections.push(section);
        if (section.type === 'heading') {
          currentHeading = { title: section.title || '', level: section.level || 1 };
        }
      }
    }

    return sections;
  }

  /**
   * 将 AST 节点转换为段落信息
   */
  private nodeToSection(
    node: RootContent,
    code: string,
    currentHeading: { title: string; level: number } | null
  ): MarkdownSection | null {
    const pos = node.position;
    if (!pos) return null;

    const startLine = pos.start.line;
    const endLine = pos.end.line;
    const content = code.slice(pos.start.offset ?? 0, pos.end.offset ?? code.length);

    switch (node.type) {
      case 'heading': {
        const headingNode = node as Heading;
        return {
          type: 'heading',
          level: headingNode.depth,
          title: toString(headingNode),
          content,
          startLine,
          endLine
        };
      }
      case 'code': {
        const codeNode = node as Code;
        return {
          type: 'code-block',
          title: currentHeading?.title,
          content,
          startLine,
          endLine,
          language: codeNode.lang || undefined
        };
      }
      case 'paragraph': {
        const text = toString(node as Paragraph);
        // 过滤过短的段落
        if (text.length < 20) return null;
        return {
          type: 'paragraph',
          title: currentHeading?.title,
          content: text,
          startLine,
          endLine
        };
      }
      case 'list': {
        const text = toString(node as List);
        if (text.length < 20) return null;
        return {
          type: 'list',
          title: currentHeading?.title,
          content: text,
          startLine,
          endLine
        };
      }
      default:
        return null;
    }
  }

  /**
   * 构建向量索引块
   */
  private buildChunks(
    sections: MarkdownSection[],
    params: {
      filePath: string;
      workspaceId: string;
      repoId: string;
      repoName: string;
      commit: string;
    }
  ): MarkdownChunk[] {
    return sections.map((section, index) => {
      const symbolName = this.generateSymbolName(section, index);
      const symbolId = generateSymbolId({
        workspaceId: params.workspaceId,
        repoId: params.repoId,
        filePath: params.filePath,
        symbolName
      });

      const embeddingText = this.prepareEmbeddingText(section, params.filePath);

      const payload: SymbolPayload = {
        workspace_id: params.workspaceId,
        repo_id: params.repoId,
        repo_name: params.repoName,
        file_path: params.filePath,
        language: 'markdown',
        symbol_id: symbolId,
        symbol_name: symbolName,
        symbol_kind: this.mapSectionTypeToKind(section.type),
        exported: true,
        visibility: 'public' as Visibility,
        code: section.content,
        signature: section.title,
        importance: this.calculateImportance(section),
        commit: params.commit,
        indexed_at: Date.now()
      };

      return { symbolId, embeddingText, payload };
    });
  }

  /**
   * 生成符号名称
   */
  private generateSymbolName(section: MarkdownSection, index: number): string {
    if (section.type === 'heading' && section.title) {
      return `h${section.level}-${this.slugify(section.title)}`;
    }
    if (section.title) {
      return `${section.type}-${this.slugify(section.title)}-${index}`;
    }
    return `${section.type}-${index}`;
  }

  /**
   * 将标题转换为 slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  /**
   * 准备用于向量嵌入的文本
   */
  private prepareEmbeddingText(section: MarkdownSection, filePath: string): string {
    const parts: string[] = [];

    // 添加文件路径上下文
    parts.push(`File: ${filePath}`);

    // 添加所属标题
    if (section.title && section.type !== 'heading') {
      parts.push(`Section: ${section.title}`);
    }

    // 添加内容
    if (section.type === 'heading') {
      parts.push(`Heading: ${section.content}`);
    } else if (section.type === 'code-block') {
      const lang = section.language ? `(${section.language})` : '';
      parts.push(`Code block${lang}:\n${section.content}`);
    } else {
      parts.push(section.content);
    }

    return parts.join('\n');
  }

  /**
   * 映射段落类型到符号类型
   */
  private mapSectionTypeToKind(type: MarkdownSection['type']): SymbolKind {
    switch (type) {
      case 'heading':
        return 'heading';
      case 'code-block':
        return 'code-block';
      case 'paragraph':
      case 'list':
        return 'paragraph';
      default:
        return 'paragraph';
    }
  }

  /**
   * 计算重要性分数
   */
  private calculateImportance(section: MarkdownSection): number {
    let score = 0.5;

    // 标题权重更高
    if (section.type === 'heading') {
      // 一级标题最重要
      score = 1.0 - (section.level || 1) * 0.1;
    }

    // 代码块权重较高
    if (section.type === 'code-block') {
      score = 0.8;
    }

    // 内容长度加分
    if (section.content.length > 200) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }
}
