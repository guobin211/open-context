import Parser from 'tree-sitter';
import { EdgeType } from '../../types';
import { ASTParser, type ParseResult, type SupportLanguage } from './ast-parser';

export interface GraphEdge {
  from: string;
  to: string;
  type: EdgeType;
  confidence: number;
}

export class GraphBuilder {
  private parser: ASTParser;

  constructor(parser: ASTParser) {
    this.parser = parser;
  }

  /**
   * 从代码字符串构建依赖图（会解析代码）
   */
  build(params: {
    code: string;
    language: SupportLanguage;
    filePath: string;
    workspaceId: string;
    repoId: string;
  }): GraphEdge[] {
    const tree = this.parser.parse(params.code, params.language, params.filePath);
    return this.buildFromTree(tree, params.code, params);
  }

  /**
   * 从已解析的 AST 构建依赖图（复用已有的解析结果）
   */
  buildFromTree(
    tree: Parser.Tree,
    code: string,
    params: { filePath: string; workspaceId: string; repoId: string }
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    const symbols = this.extractSymbolLocations(tree.rootNode, code, '');
    const imports = this.extractImports(tree.rootNode, code);
    const calls = this.extractCalls(tree.rootNode, code, symbols, params);

    edges.push(...imports, ...calls);

    return edges;
  }

  /**
   * 从 ParseResult 构建依赖图
   */
  buildFromParseResult(
    parseResult: ParseResult,
    params: { filePath: string; workspaceId: string; repoId: string }
  ): GraphEdge[] {
    return this.buildFromTree(parseResult.tree, parseResult.code, params);
  }

  private extractSymbolLocations(
    node: Parser.SyntaxNode,
    code: string,
    parentName: string
  ): Array<{ name: string; qualifiedName: string; startLine: number; endLine: number }> {
    const symbols: Array<{ name: string; qualifiedName: string; startLine: number; endLine: number }> = [];

    let name = '';
    switch (node.type) {
      case 'function_declaration':
      case 'method_definition':
      case 'class_declaration':
      case 'interface_declaration':
      case 'type_alias_declaration': {
        const nameNode = node.childForFieldName('name');
        name = nameNode ? this.parser.getNodeText(nameNode, code) : 'anonymous';
        break;
      }
      case 'variable_declarator': {
        const nameNode = node.childForFieldName('name');
        const valueNode = node.childForFieldName('value');
        if (
          nameNode &&
          valueNode &&
          (valueNode.type === 'arrow_function' || valueNode.type === 'function_expression')
        ) {
          name = this.parser.getNodeText(nameNode, code);
        }
        break;
      }
    }

    let qualifiedName = parentName;
    if (name) {
      qualifiedName = parentName ? `${parentName}.${name}` : name;
      const loc = this.parser.getNodeLocation(node);
      symbols.push({
        name,
        qualifiedName,
        startLine: loc.startLine,
        endLine: loc.endLine
      });
    }

    for (const child of node.children) {
      symbols.push(...this.extractSymbolLocations(child, code, qualifiedName));
    }

    return symbols;
  }

  private extractImports(root: Parser.SyntaxNode, code: string): GraphEdge[] {
    const importNodes = this.parser.findNodesByType(root, 'import_statement');
    const edges: GraphEdge[] = [];

    for (const node of importNodes) {
      const sourceNode = node.childForFieldName('source');
      if (sourceNode) {
        const source = this.parser.getNodeText(sourceNode, code).replace(/['"]/g, '');
        edges.push({
          from: 'file',
          to: source,
          type: 'IMPORTS',
          confidence: 1.0
        });
      }
    }

    return edges;
  }

  private extractCalls(
    root: Parser.SyntaxNode,
    code: string,
    symbols: Array<{ qualifiedName: string; startLine: number; endLine: number }>,
    params: { workspaceId: string; repoId: string; filePath: string }
  ): GraphEdge[] {
    const callNodes = this.parser.findNodesByType(root, 'call_expression');
    const edges: GraphEdge[] = [];

    for (const node of callNodes) {
      const functionNode = node.childForFieldName('function');
      if (!functionNode) continue;

      const functionName = this.parser.getNodeText(functionNode, code);
      const loc = this.parser.getNodeLocation(node);

      const enclosingSymbol = [...symbols]
        .reverse()
        .find((s) => loc.startLine >= s.startLine && loc.endLine <= s.endLine);

      if (enclosingSymbol) {
        let targetName = functionName;

        if (functionName.startsWith('this.')) {
          const methodPart = functionName.slice(5);
          const parts = enclosingSymbol.qualifiedName.split('.');
          if (parts.length > 1) {
            targetName = parts.slice(0, -1).join('.') + '.' + methodPart;
          }
        }

        const fromId = `${params.workspaceId}/${params.repoId}/${params.filePath}#${enclosingSymbol.qualifiedName}`;
        edges.push({
          from: fromId,
          to: targetName,
          type: 'CALLS',
          confidence: 0.8
        });
      }
    }

    return edges;
  }
}
