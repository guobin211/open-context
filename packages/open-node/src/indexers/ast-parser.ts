import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import JavaScript from 'tree-sitter-javascript';

export class ASTParser {
  private tsParser: Parser;
  private jsParser: Parser;

  constructor() {
    this.tsParser = new Parser();
    this.tsParser.setLanguage(TypeScript.typescript);

    this.jsParser = new Parser();
    this.jsParser.setLanguage(JavaScript);
  }

  parse(code: string, language: 'typescript' | 'javascript'): Parser.Tree {
    const parser = language === 'typescript' ? this.tsParser : this.jsParser;
    return parser.parse(code);
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

  getNodeLocation(node: Parser.SyntaxNode): { startLine: number; endLine: number } {
    return {
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1
    };
  }
}
