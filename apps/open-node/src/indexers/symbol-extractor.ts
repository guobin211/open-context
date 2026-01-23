import Parser from 'tree-sitter';
import { ASTParser } from './ast-parser';
import { SymbolKind, Visibility } from '../types';

export interface ExtractedSymbol {
  name: string;
  qualifiedName: string;
  kind: SymbolKind;
  visibility: Visibility;
  exported: boolean;
  location: { startLine: number; endLine: number };
  signature?: string;
  docComment?: string;
  codeChunk: string;
}

export class SymbolExtractor {
  private parser: ASTParser;

  constructor() {
    this.parser = new ASTParser();
  }

  extract(code: string, language: 'typescript' | 'javascript'): ExtractedSymbol[] {
    const tree = this.parser.parse(code, language);
    const symbols: ExtractedSymbol[] = [];

    this.traverseAndExtract(tree.rootNode, code, '', symbols);

    return symbols;
  }

  private traverseAndExtract(
    node: Parser.SyntaxNode,
    code: string,
    parentName: string,
    symbols: ExtractedSymbol[]
  ): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'function_declaration':
      case 'method_definition': {
        currentSymbol = this.parseFunctionNode(node, code, parentName);
        break;
      }
      case 'class_declaration': {
        currentSymbol = this.parseClassNode(node, code, parentName);
        break;
      }
      case 'interface_declaration': {
        currentSymbol = this.parseInterfaceNode(node, code, parentName);
        break;
      }
      case 'type_alias_declaration': {
        currentSymbol = this.parseTypeNode(node, code, parentName);
        break;
      }
      case 'lexical_declaration':
      case 'variable_declaration': {
        const arrowFuncSymbols = this.extractArrowFunctionsFromVariable(node, code, parentName);
        symbols.push(...arrowFuncSymbols);
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParentName = currentSymbol ? currentSymbol.qualifiedName : parentName;

    for (const child of node.children) {
      this.traverseAndExtract(child, code, nextParentName, symbols);
    }
  }

  private extractArrowFunctionsFromVariable(
    node: Parser.SyntaxNode,
    code: string,
    parentName: string
  ): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const declarators = this.parser.findNodesByType(node, 'variable_declarator');

    for (const decl of declarators) {
      const nameNode = decl.childForFieldName('name');
      const valueNode = decl.childForFieldName('value');

      if (nameNode && valueNode && (valueNode.type === 'arrow_function' || valueNode.type === 'function_expression')) {
        const name = this.parser.getNodeText(nameNode, code);
        const qualifiedName = parentName ? `${parentName}.${name}` : name;

        symbols.push({
          name,
          qualifiedName,
          kind: 'function',
          visibility: 'public',
          exported: this.isExported(node),
          location: this.parser.getNodeLocation(decl),
          signature: this.extractFunctionSignature(valueNode, code, name),
          docComment: this.extractDocComment(node, code),
          codeChunk: this.parser.getNodeText(node, code)
        });
      }
    }

    return symbols;
  }

  private parseFunctionNode(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = node.childForFieldName('name');
    const name = nameNode ? this.parser.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = parentName ? `${parentName}.${name}` : name;

    const exported = this.isExported(node);
    const docComment = this.extractDocComment(node, code);
    const signature = this.extractFunctionSignature(node, code);

    return {
      name,
      qualifiedName,
      kind: node.type === 'method_definition' ? 'method' : 'function',
      visibility: 'public',
      exported,
      location: this.parser.getNodeLocation(node),
      signature,
      docComment,
      codeChunk: this.parser.getNodeText(node, code)
    };
  }

  private parseClassNode(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = node.childForFieldName('name');
    const name = nameNode ? this.parser.getNodeText(nameNode, code) : 'AnonymousClass';
    const qualifiedName = parentName ? `${parentName}.${name}` : name;

    return {
      name,
      qualifiedName,
      kind: 'class',
      visibility: 'public',
      exported: this.isExported(node),
      location: this.parser.getNodeLocation(node),
      docComment: this.extractDocComment(node, code),
      codeChunk: this.parser.getNodeText(node, code)
    };
  }

  private parseInterfaceNode(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = node.childForFieldName('name');
    const name = nameNode ? this.parser.getNodeText(nameNode, code) : 'AnonymousInterface';
    const qualifiedName = parentName ? `${parentName}.${name}` : name;

    return {
      name,
      qualifiedName,
      kind: 'interface',
      visibility: 'public',
      exported: this.isExported(node),
      location: this.parser.getNodeLocation(node),
      docComment: this.extractDocComment(node, code),
      codeChunk: this.parser.getNodeText(node, code)
    };
  }

  private parseTypeNode(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = node.childForFieldName('name');
    const name = nameNode ? this.parser.getNodeText(nameNode, code) : 'AnonymousType';
    const qualifiedName = parentName ? `${parentName}.${name}` : name;

    return {
      name,
      qualifiedName,
      kind: 'type',
      visibility: 'public',
      exported: this.isExported(node),
      location: this.parser.getNodeLocation(node),
      docComment: this.extractDocComment(node, code),
      codeChunk: this.parser.getNodeText(node, code)
    };
  }

  private isExported(node: Parser.SyntaxNode): boolean {
    let current = node.parent;
    while (current) {
      if (current.type === 'export_statement' || current.type === 'export_declaration') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private extractDocComment(node: Parser.SyntaxNode, code: string): string | undefined {
    const prev = node.previousSibling;
    if (prev && prev.type === 'comment') {
      return this.parser.getNodeText(prev, code);
    }
    return undefined;
  }

  private extractFunctionSignature(node: Parser.SyntaxNode, code: string, nameOverride?: string): string | undefined {
    const nameNode = node.childForFieldName('name');
    const paramsNode = node.childForFieldName('parameters');
    const returnTypeNode = node.childForFieldName('return_type');

    if (!nameNode && !nameOverride) return undefined;

    let signature = nameOverride || this.parser.getNodeText(nameNode!, code);

    if (paramsNode) {
      signature += this.parser.getNodeText(paramsNode, code);
    }

    if (returnTypeNode) {
      const returnTypeText = this.parser.getNodeText(returnTypeNode, code);
      signature += returnTypeText.startsWith(':') ? returnTypeText : ': ' + returnTypeText;
    }

    if (node.type === 'function_declaration') {
      signature = 'function ' + signature;
    } else if (node.type === 'method_definition') {
      signature = 'method ' + signature;
    } else if (node.type === 'arrow_function') {
      signature = 'const ' + (nameOverride || '') + ' = ' + signature;
    }

    return signature;
  }
}
