import Parser from 'tree-sitter';
import type { SupportLanguage } from './ast-parser';
import type { SymbolKind, Visibility } from '../types';
import type { ExtractedSymbol } from './code-symbol-extractor';

export class MultiLanguageSymbolExtractor {
  private extractors: Map<SupportLanguage, LanguageExtractor> = new Map();

  constructor() {
    this.extractors.set('c', new CExtractor());
    this.extractors.set('cpp', new CppExtractor());
    this.extractors.set('csharp', new CSharpExtractor());
    this.extractors.set('go', new GoExtractor());
    this.extractors.set('python', new PythonExtractor());
  }

  extract(tree: Parser.Tree, code: string, language: SupportLanguage): ExtractedSymbol[] {
    const extractor = this.extractors.get(language);
    if (!extractor) {
      return [];
    }
    return extractor.extract(tree, code);
  }

  isSupported(language: SupportLanguage): boolean {
    return this.extractors.has(language);
  }
}

abstract class LanguageExtractor {
  abstract extract(tree: Parser.Tree, code: string): ExtractedSymbol[];

  protected getNodeText(node: Parser.SyntaxNode | null, code: string): string {
    if (!node) return '';
    return code.slice(node.startIndex, node.endIndex);
  }

  protected getNodeLocation(node: Parser.SyntaxNode): { startLine: number; endLine: number } {
    return {
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1
    };
  }

  protected findChildByType(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
    for (const child of node.children) {
      if (child.type === type) {
        return child;
      }
    }
    return null;
  }

  protected findChildByTypes(node: Parser.SyntaxNode, types: string[]): Parser.SyntaxNode | null {
    for (const child of node.children) {
      if (types.includes(child.type)) {
        return child;
      }
    }
    return null;
  }

  protected extractDocComment(node: Parser.SyntaxNode, code: string): string | undefined {
    const prev = node.previousSibling;
    if (prev && (prev.type === 'comment' || prev.type === 'block_comment')) {
      return this.getNodeText(prev, code).trim();
    }
    return undefined;
  }

  protected getQualifiedName(name: string, parentName: string): string {
    return parentName ? `${parentName}.${name}` : name;
  }

  protected createSymbol(
    name: string,
    qualifiedName: string,
    kind: SymbolKind,
    visibility: Visibility,
    exported: boolean,
    location: { startLine: number; endLine: number },
    code: string,
    docComment?: string,
    signature?: string
  ): ExtractedSymbol {
    return {
      name,
      qualifiedName,
      kind,
      visibility,
      exported,
      location,
      codeChunk: code,
      docComment,
      signature
    };
  }
}

class CExtractor extends LanguageExtractor {
  extract(tree: Parser.Tree, code: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    this.traverse(tree.rootNode, code, '', symbols);
    return symbols;
  }

  private traverse(node: Parser.SyntaxNode, code: string, parentName: string, symbols: ExtractedSymbol[]): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'function_definition': {
        currentSymbol = this.parseFunction(node, code, parentName);
        break;
      }
      case 'type_definition': {
        currentSymbol = this.parseTypeDefinition(node, code, parentName);
        break;
      }
      case 'declaration': {
        const funcPointerSymbol = this.parseFunctionPointer(node, code, parentName);
        if (funcPointerSymbol) {
          symbols.push(funcPointerSymbol);
        }
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParent = currentSymbol ? currentSymbol.qualifiedName : parentName;
    for (const child of node.children) {
      this.traverse(child, code, nextParent, symbols);
    }
  }

  private parseTypeDefinition(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol | null {
    const structSpec = this.findChildByType(node, 'struct_specifier');
    const enumSpec = this.findChildByType(node, 'enum_specifier');

    if (structSpec) {
      return this.parseStruct(structSpec, code, parentName);
    }

    if (enumSpec) {
      return this.parseEnum(enumSpec, code, parentName);
    }

    return null;
  }

  private parseFunction(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const declarator = this.findChildByType(node, 'function_declarator');
    const nameNode = declarator ? this.findChildByType(declarator, 'identifier') : null;
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'function',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractFunctionSignature(node, code, name)
    );
  }

  private parseStruct(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseEnum(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'enum',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseFunctionPointer(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol | null {
    const declarator = this.findChildByType(node, 'function_declarator');
    if (!declarator) return null;

    const pointerDeclarator = this.findChildByType(declarator, 'pointer_declarator');
    if (!pointerDeclarator) return null;

    const nameNode = this.findChildByType(pointerDeclarator, 'identifier');
    if (!nameNode) return null;

    const name = this.getNodeText(nameNode, code);
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'function',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractFunctionSignature(node, code, name)
    );
  }

  private extractFunctionSignature(node: Parser.SyntaxNode, code: string, name: string): string | undefined {
    const declarator = this.findChildByType(node, 'function_declarator');
    if (!declarator) return undefined;

    const params = this.findChildByType(declarator, 'parameter_list');
    let signature = name;

    if (params) {
      signature += this.getNodeText(params, code);
    }

    return signature;
  }
}

class CppExtractor extends LanguageExtractor {
  extract(tree: Parser.Tree, code: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    this.traverse(tree.rootNode, code, '', symbols);
    return symbols;
  }

  private traverse(node: Parser.SyntaxNode, code: string, parentName: string, symbols: ExtractedSymbol[]): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'function_definition_definition': {
        currentSymbol = this.parseFunction(node, code, parentName);
        break;
      }
      case 'function_declaration': {
        currentSymbol = this.parseFunction(node, code, parentName);
        break;
      }
      case 'class_specifier': {
        currentSymbol = this.parseClass(node, code, parentName);
        break;
      }
      case 'struct_specifier': {
        currentSymbol = this.parseStruct(node, code, parentName);
        break;
      }
      case 'enum_specifier': {
        currentSymbol = this.parseEnum(node, code, parentName);
        break;
      }
      case 'namespace_definition': {
        const namespaceName = this.parseNamespaceName(node, code);
        this.traverseNamespace(node, code, namespaceName, symbols);
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParent = currentSymbol ? currentSymbol.qualifiedName : parentName;
    for (const child of node.children) {
      this.traverse(child, code, nextParent, symbols);
    }
  }

  private traverseNamespace(
    node: Parser.SyntaxNode,
    code: string,
    namespaceName: string,
    symbols: ExtractedSymbol[]
  ): void {
    const body = this.findChildByTypes(node, ['block', 'declaration_list']);
    if (!body) return;

    for (const child of body.children) {
      this.traverse(child, code, namespaceName, symbols);
    }
  }

  private parseNamespaceName(node: Parser.SyntaxNode, code: string): string {
    const nameNode = this.findChildByType(node, 'namespace_identifier');
    return nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
  }

  private parseFunction(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const declarator = this.findChildByType(node, 'function_declarator');
    const nameNode = declarator ? this.findChildByType(declarator, 'identifier') : null;
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const visibility = this.extractVisibility(node);

    return this.createSymbol(
      name,
      qualifiedName,
      'function',
      visibility,
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractFunctionSignature(node, code, name)
    );
  }

  private parseClass(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousClass';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseStruct(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousStruct';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseEnum(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousEnum';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'enum',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private extractVisibility(node: Parser.SyntaxNode): Visibility {
    let current = node.parent;
    while (current) {
      if (current.type === 'access_specifier') {
        const text = this.getNodeText(current, '');
        if (text.includes('private')) return 'private';
        if (text.includes('protected')) return 'protected';
      }
      current = current.parent;
    }
    return 'public';
  }

  private extractFunctionSignature(node: Parser.SyntaxNode, code: string, name: string): string | undefined {
    const declarator = this.findChildByType(node, 'function_declarator');
    if (!declarator) return undefined;

    const params = this.findChildByType(declarator, 'parameter_list');
    let signature = name;

    if (params) {
      signature += this.getNodeText(params, code);
    }

    return signature;
  }
}

class CSharpExtractor extends LanguageExtractor {
  extract(tree: Parser.Tree, code: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    this.traverse(tree.rootNode, code, '', symbols);
    return symbols;
  }

  private traverse(node: Parser.SyntaxNode, code: string, parentName: string, symbols: ExtractedSymbol[]): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'method_declaration': {
        currentSymbol = this.parseMethod(node, code, parentName);
        break;
      }
      case 'class_declaration': {
        currentSymbol = this.parseClass(node, code, parentName);
        break;
      }
      case 'struct_declaration': {
        currentSymbol = this.parseStruct(node, code, parentName);
        break;
      }
      case 'enum_declaration': {
        currentSymbol = this.parseEnum(node, code, parentName);
        break;
      }
      case 'interface_declaration': {
        currentSymbol = this.parseInterface(node, code, parentName);
        break;
      }
      case 'namespace_declaration': {
        const namespaceName = this.parseNamespaceName(node, code);
        this.traverseNamespace(node, code, namespaceName, symbols);
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParent = currentSymbol ? currentSymbol.qualifiedName : parentName;
    for (const child of node.children) {
      this.traverse(child, code, nextParent, symbols);
    }
  }

  private traverseNamespace(
    node: Parser.SyntaxNode,
    code: string,
    namespaceName: string,
    symbols: ExtractedSymbol[]
  ): void {
    const body = this.findChildByType(node, 'block');
    if (!body) return;

    for (const child of body.children) {
      this.traverse(child, code, namespaceName, symbols);
    }
  }

  private parseNamespaceName(node: Parser.SyntaxNode, code: string): string {
    const nameNode = this.findChildByType(node, 'identifier');
    return nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
  }

  private parseMethod(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const visibility = this.extractVisibility(node);

    return this.createSymbol(
      name,
      qualifiedName,
      'method',
      visibility,
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractMethodSignature(node, code, name)
    );
  }

  private parseClass(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousClass';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseStruct(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousStruct';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseEnum(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousEnum';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'enum',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseInterface(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousInterface';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'interface',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private extractVisibility(node: Parser.SyntaxNode): Visibility {
    const modifiers = this.findChildByType(node, 'modifiers');
    if (!modifiers) return 'public';

    const modifierText = this.getNodeText(modifiers, '').toLowerCase();
    if (modifierText.includes('private')) return 'private';
    if (modifierText.includes('protected')) return 'protected';
    if (modifierText.includes('internal')) return 'private';
    return 'public';
  }

  private extractMethodSignature(node: Parser.SyntaxNode, code: string, name: string): string | undefined {
    const params = this.findChildByType(node, 'parameter_list');
    const returnNode = this.findChildByType(node, 'type');

    let signature = name;

    if (params) {
      signature += this.getNodeText(params, code);
    }

    if (returnNode) {
      const returnType = this.getNodeText(returnNode, code).trim();
      signature += `: ${returnType}`;
    }

    return signature;
  }
}

class GoExtractor extends LanguageExtractor {
  extract(tree: Parser.Tree, code: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    this.traverse(tree.rootNode, code, '', symbols);
    return symbols;
  }

  private traverse(node: Parser.SyntaxNode, code: string, parentName: string, symbols: ExtractedSymbol[]): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'function_declaration': {
        currentSymbol = this.parseFunction(node, code, parentName);
        break;
      }
      case 'method_declaration': {
        currentSymbol = this.parseMethod(node, code, parentName);
        break;
      }
      case 'type_declaration': {
        currentSymbol = this.parseTypeDeclaration(node, code, parentName);
        break;
      }
      case 'var_declaration': {
        const varSymbols = this.parseVarDeclaration(node, code, parentName);
        symbols.push(...varSymbols);
        break;
      }
      case 'const_declaration': {
        const constSymbols = this.parseConstDeclaration(node, code, parentName);
        symbols.push(...constSymbols);
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParent = currentSymbol ? currentSymbol.qualifiedName : parentName;
    for (const child of node.children) {
      this.traverse(child, code, nextParent, symbols);
    }
  }

  private parseFunction(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const exported = this.isExported(name);

    return this.createSymbol(
      name,
      qualifiedName,
      'function',
      'public',
      exported,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractFunctionSignature(node, code, name)
    );
  }

  private parseMethod(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'field_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const receiver = this.findChildByType(node, 'parameter_list');
    const receiverText = receiver ? this.getNodeText(receiver, code) : '';

    return this.createSymbol(
      name,
      qualifiedName,
      'method',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractMethodSignature(node, code, name, receiverText)
    );
  }

  private parseTypeDeclaration(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol | null {
    const spec = this.findChildByType(node, 'type_spec');
    if (!spec) return null;

    const nameNode = this.findChildByType(spec, 'type_identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const exported = this.isExported(name);

    const typeNode = this.findChildByType(spec, 'struct_type');
    let kind: SymbolKind = 'type';

    if (typeNode) {
      kind = 'class';
    } else if (this.findChildByType(spec, 'interface_type')) {
      kind = 'interface';
    }

    return this.createSymbol(
      name,
      qualifiedName,
      kind,
      'public',
      exported,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseVarDeclaration(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const decls = this.findChildByType(node, 'var_spec_list');
    if (!decls) return symbols;

    for (const child of decls.children) {
      if (child.type === 'var_spec') {
        const nameNode = this.findChildByType(child, 'identifier');
        if (nameNode) {
          const name = this.getNodeText(nameNode, code);
          const qualifiedName = this.getQualifiedName(name, parentName);
          const exported = this.isExported(name);

          symbols.push(
            this.createSymbol(
              name,
              qualifiedName,
              'variable',
              'public',
              exported,
              this.getNodeLocation(child),
              this.getNodeText(child, code),
              this.extractDocComment(child, code)
            )
          );
        }
      }
    }

    return symbols;
  }

  private parseConstDeclaration(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    const decls = this.findChildByType(node, 'const_spec_list');
    if (!decls) return symbols;

    for (const child of decls.children) {
      if (child.type === 'const_spec') {
        const nameNode = this.findChildByType(child, 'identifier');
        if (nameNode) {
          const name = this.getNodeText(nameNode, code);
          const qualifiedName = this.getQualifiedName(name, parentName);
          const exported = this.isExported(name);

          symbols.push(
            this.createSymbol(
              name,
              qualifiedName,
              'variable',
              'public',
              exported,
              this.getNodeLocation(child),
              this.getNodeText(child, code),
              this.extractDocComment(child, code)
            )
          );
        }
      }
    }

    return symbols;
  }

  private isExported(name: string): boolean {
    return name.length > 0 && name[0] === name[0].toUpperCase() && name[0] !== '_';
  }

  private extractFunctionSignature(node: Parser.SyntaxNode, code: string, name: string): string | undefined {
    const params = this.findChildByType(node, 'parameter_list');
    const result = this.findChildByType(node, 'result');

    let signature = name;

    if (params) {
      signature += this.getNodeText(params, code);
    }

    if (result) {
      const resultText = this.getNodeText(result, code).trim();
      signature += `${resultText}`;
    }

    return signature;
  }

  private extractMethodSignature(
    node: Parser.SyntaxNode,
    code: string,
    name: string,
    receiverText: string
  ): string | undefined {
    const params = this.findChildByType(node, 'parameter_list');
    const result = this.findChildByType(node, 'result');

    let signature = name;

    if (params) {
      const paramText = this.getNodeText(params, code);
      const receiverEnd = receiverText.length;
      if (paramText.startsWith(receiverText)) {
        signature += paramText.substring(receiverEnd).trim();
      } else {
        signature += paramText;
      }
    }

    if (result) {
      const resultText = this.getNodeText(result, code).trim();
      signature += `${resultText}`;
    }

    return signature;
  }
}

class PythonExtractor extends LanguageExtractor {
  extract(tree: Parser.Tree, code: string): ExtractedSymbol[] {
    const symbols: ExtractedSymbol[] = [];
    this.traverse(tree.rootNode, code, '', symbols);
    return symbols;
  }

  private traverse(node: Parser.SyntaxNode, code: string, parentName: string, symbols: ExtractedSymbol[]): void {
    let currentSymbol: ExtractedSymbol | null = null;

    switch (node.type) {
      case 'function_definition': {
        currentSymbol = this.parseFunction(node, code, parentName);
        break;
      }
      case 'class_definition': {
        currentSymbol = this.parseClass(node, code, parentName);
        const classBody = this.findChildByType(node, 'block');
        if (classBody) {
          for (const child of classBody.children) {
            if (child.type === 'function_definition') {
              const methodSymbol = this.parseFunction(child, code, currentSymbol?.qualifiedName || parentName);
              if (methodSymbol) {
                symbols.push(methodSymbol);
              }
            }
          }
        }
        break;
      }
      case 'decorated_definition': {
        const decoratedSymbol = this.parseDecoratedDefinition(node, code, parentName);
        if (decoratedSymbol) {
          symbols.push(decoratedSymbol);
        }
        break;
      }
    }

    if (currentSymbol) {
      symbols.push(currentSymbol);
    }

    const nextParent = currentSymbol ? currentSymbol.qualifiedName : parentName;

    for (const child of node.children) {
      if (child.type === 'assignment') {
        const varSymbol = this.parseAssignment(child, code, nextParent);
        if (varSymbol) {
          symbols.push(varSymbol);
        }
      } else if (child.type !== 'class_definition') {
        this.traverse(child, code, nextParent, symbols);
      }
    }
  }

  private parseFunction(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'anonymous';
    const qualifiedName = this.getQualifiedName(name, parentName);

    const visibility = this.extractVisibility(name);

    return this.createSymbol(
      name,
      qualifiedName,
      'function',
      visibility,
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code),
      this.extractFunctionSignature(node, code, name)
    );
  }

  private parseClass(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol {
    const nameNode = this.findChildByType(node, 'identifier');
    const name = nameNode ? this.getNodeText(nameNode, code) : 'AnonymousClass';
    const qualifiedName = this.getQualifiedName(name, parentName);

    return this.createSymbol(
      name,
      qualifiedName,
      'class',
      'public',
      false,
      this.getNodeLocation(node),
      this.getNodeText(node, code),
      this.extractDocComment(node, code)
    );
  }

  private parseAssignment(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol | null {
    const left = node.children[0];
    const right = node.children[1];

    if (!left || !right) return null;

    if (right.type === 'lambda') {
      const nameNode = this.findChildByType(left, 'identifier');
      if (!nameNode) return null;

      const name = this.getNodeText(nameNode, code);
      const qualifiedName = this.getQualifiedName(name, parentName);
      const visibility = this.extractVisibility(name);

      return this.createSymbol(
        name,
        qualifiedName,
        'function',
        visibility,
        false,
        this.getNodeLocation(node),
        this.getNodeText(node, code),
        this.extractDocComment(node, code),
        `${name} = ${this.getNodeText(right, code)}`
      );
    }

    return null;
  }

  private parseDecoratedDefinition(node: Parser.SyntaxNode, code: string, parentName: string): ExtractedSymbol | null {
    const definition = this.findChildByType(node, 'function_definition');
    if (!definition) {
      const classDef = this.findChildByType(node, 'class_definition');
      if (classDef) {
        return this.parseClass(classDef, code, parentName);
      }
      return null;
    }

    return this.parseFunction(definition, code, parentName);
  }

  private extractVisibility(name: string): Visibility {
    if (name.startsWith('__') && name.endsWith('__')) {
      return 'public';
    }
    if (name.startsWith('_')) {
      return 'private';
    }
    return 'public';
  }

  private extractFunctionSignature(node: Parser.SyntaxNode, code: string, name: string): string | undefined {
    const params = this.findChildByType(node, 'parameters');
    const returnType = this.findChildByType(node, 'type');

    let signature = name;

    if (params) {
      signature += this.getNodeText(params, code);
    }

    if (returnType) {
      const returnText = this.getNodeText(returnType, code).trim();
      if (returnText && returnText !== '->') {
        signature += ` ${returnText}`;
      }
    }

    return signature;
  }
}
