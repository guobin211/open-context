import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';
import Go from 'tree-sitter-go';
import Cpp from 'tree-sitter-cpp';
import C from 'tree-sitter-c';
import CSharp from 'tree-sitter-c-sharp';
import Bash from 'tree-sitter-bash';
import CSS from 'tree-sitter-css';
import HTML from 'tree-sitter-html';
import JSON from 'tree-sitter-json';

export type SupportLanguage =
  | 'ts'
  | 'tsx'
  | 'js'
  | 'jsx'
  | 'python'
  | 'go'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'bash'
  | 'css'
  | 'html'
  | 'json'
  | 'markdown';

/**
 * 解析结果，包含 AST 树和原始代码
 */
export interface ParseResult {
  tree: Parser.Tree;
  code: string;
  language: SupportLanguage;
}

/**
 * 语言与文件扩展名的映射
 */
export const LANGUAGE_EXTENSIONS: Record<string, SupportLanguage> = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.mjs': 'js',
  '.cjs': 'js',
  '.py': 'python',
  '.pyw': 'python',
  '.go': 'go',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.cs': 'csharp',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.html': 'html',
  '.htm': 'html',
  '.json': 'json',
  '.md': 'markdown',
  '.mdc': 'markdown',
  '.mdx': 'markdown'
};

/**
 * 根据文件扩展名获取语言类型
 */
export function getLanguageFromExt(ext: string): SupportLanguage | null {
  return LANGUAGE_EXTENSIONS[ext.toLowerCase()] || null;
}

export class ASTParser {
  private parsers: Map<SupportLanguage, Parser> = new Map();
  private treeCache: Map<string, Parser.Tree> = new Map();

  constructor() {
    this.initParser('ts', TypeScript.typescript);
    this.initParser('tsx', TypeScript.tsx);
    this.initParser('js', JavaScript);
    this.initParser('jsx', TypeScript.tsx);
    this.initParser('python', Python);
    this.initParser('go', Go);
    this.initParser('cpp', Cpp);
    this.initParser('c', C);
    this.initParser('csharp', CSharp);
    this.initParser('bash', Bash);
    this.initParser('css', CSS);
    this.initParser('html', HTML);
    this.initParser('json', JSON);
  }

  private initParser(language: SupportLanguage, grammar: any): void {
    const parser = new Parser();
    parser.setLanguage(grammar);
    this.parsers.set(language, parser);
  }

  parse(code: string, language: SupportLanguage, filePath: string): Parser.Tree {
    const parser = this.parsers.get(language);
    if (!parser) {
      throw new Error(`Unsupported language: ${language}`);
    }
    if (this.treeCache.has(filePath)) {
      return this.treeCache.get(filePath)!;
    }
    const ast = parser.parse(code);
    this.treeCache.set(filePath, ast);
    return ast;
  }

  parseWithResult(code: string, language: SupportLanguage, filePath: string): ParseResult {
    const ast = this.parse(code, language, filePath);
    return { tree: ast, code, language };
  }

  getNodeText(node: Parser.SyntaxNode, code: string): string {
    return code.slice(node.startIndex, node.endIndex);
  }

  findNodesByType(root: Parser.SyntaxNode, type: string): Parser.SyntaxNode[] {
    const nodes: Parser.SyntaxNode[] = [];

    const traverse = (node: Parser.SyntaxNode) => {
      if (node.type === type) {
        nodes.push(node);
      }
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(root);
    return nodes;
  }

  /**
   * 查找多种类型的节点
   */
  findNodesByTypes(root: Parser.SyntaxNode, types: string[]): Parser.SyntaxNode[] {
    const nodes: Parser.SyntaxNode[] = [];
    const typeSet = new Set(types);

    const traverse = (node: Parser.SyntaxNode) => {
      if (typeSet.has(node.type)) {
        nodes.push(node);
      }
      for (const child of node.children) {
        traverse(child);
      }
    };

    traverse(root);
    return nodes;
  }

  getNodeLocation(node: Parser.SyntaxNode): { startLine: number; endLine: number } {
    return {
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1
    };
  }

  /**
   * 获取支持的所有语言
   */
  getSupportedLanguages(): SupportLanguage[] {
    return Array.from(this.parsers.keys());
  }
}

let parserInstance: ASTParser | null = null;

/**
 * 获取全局 ASTParser 单例
 */
export function getASTParser(): ASTParser {
  if (!parserInstance) {
    parserInstance = new ASTParser();
  }
  return parserInstance;
}
