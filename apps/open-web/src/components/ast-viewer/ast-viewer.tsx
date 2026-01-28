import { useState } from 'react';
import type { JSX } from 'react';
import { FileCode, Play, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AstViewerProps {
  className?: string;
}

interface AstNode {
  name: string;
  type: string;
  children?: AstNode[];
  value?: string;
}

export const AstViewer = ({ className }: AstViewerProps) => {
  const [code, setCode] = useState<string>(`function example() {
  const x = 10;
  const y = 20;
  return x + y;
}`);
  const [ast, setAst] = useState<AstNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const parseCode = (source: string): AstNode => {
    try {
      const lines = source.split('\n').filter((line) => line.trim());
      return {
        name: 'Program',
        type: 'program',
        children: parseBlock(lines, 0)
      };
    } catch {
      throw new Error('代码解析失败');
    }
  };

  const parseBlock = (lines: string[], indentLevel: number): AstNode[] => {
    const nodes: AstNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const indent = line.search(/\S|$/);
      const trimmed = line.trim();

      if (indent > indentLevel) {
        i++;
        continue;
      }

      if (indent < indentLevel) {
        break;
      }

      const node = parseStatement(trimmed);
      nodes.push(node);
      i++;
    }

    return nodes;
  };

  const parseStatement = (line: string): AstNode => {
    const matchFunction = line.match(/function\s+(\w+)/);
    if (matchFunction) {
      return {
        name: matchFunction[1],
        type: 'function',
        children: []
      };
    }
    const matchConst = line.match(/const\s+(\w+)\s*=\s*(.+);/);
    if (matchConst) {
      return {
        name: matchConst[1],
        type: 'variable',
        value: matchConst[2]
      };
    }
    const matchReturn = line.match(/return\s+(.+);/);
    if (matchReturn) {
      return {
        name: 'return',
        type: 'statement',
        value: matchReturn[1]
      };
    }

    return {
      name: line,
      type: 'unknown'
    };
  };

  const handleParse = () => {
    try {
      setError(null);
      const parsedAst = parseCode(code);
      setAst(parsedAst);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析错误');
      setAst(null);
    }
  };

  const handleCopy = () => {
    if (ast) {
      const astJson = JSON.stringify(ast, null, 2);
      void navigator.clipboard.writeText(astJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderAstNode = (node: AstNode, level: number = 0): JSX.Element => {
    const indent = level * 24;
    const colors: Record<string, string> = {
      program: 'text-purple-600',
      function: 'text-blue-600',
      variable: 'text-green-600',
      statement: 'text-orange-600',
      unknown: 'text-gray-600'
    };

    return (
      <div key={`${node.name}-${level}`} style={{ paddingLeft: `${indent}px` }} className="py-1">
        <div className="flex items-center gap-2">
          <span className={cn('font-mono text-sm', colors[node.type])}>{node.type.toUpperCase()}</span>
          <span className="font-mono text-sm">{node.name}</span>
          {node.value && <span className="text-muted-foreground font-mono text-sm">= {node.value}</span>}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="border-muted ml-2 border-l pl-2">
            {node.children.map((child) => renderAstNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex h-full flex-col gap-4', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          {error ? (
            <div className="border-destructive bg-destructive/10 text-destructive flex items-center gap-2.5 rounded-lg border p-3 text-sm">
              <XCircle className="size-4" />
              {error}
            </div>
          ) : ast ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-green-600 bg-green-600/10 p-3 text-sm text-green-700">
              <CheckCircle2 className="size-4" />
              解析成功，共 {JSON.stringify(ast).length} 个字符
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">代码输入</h3>
            <button
              onClick={handleParse}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors"
            >
              <Play className="size-4" />
              解析 AST
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="bg-muted text-muted-foreground focus:ring-primary resize-none rounded-lg p-4 font-mono text-sm focus:ring-2 focus:outline-none"
            placeholder="在此输入 JavaScript/TypeScript 代码..."
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">AST 树</h3>
            {ast && (
              <button
                onClick={handleCopy}
                className="bg-muted hover:bg-muted/80 flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="size-4 text-green-600" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    复制 JSON
                  </>
                )}
              </button>
            )}
          </div>
          <div className="bg-card border-border overflow-auto rounded-lg border p-4">
            {ast ? (
              <div>{renderAstNode(ast)}</div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FileCode className="text-muted-foreground mx-auto mb-3 size-12" />
                  <p className="text-muted-foreground text-sm">点击"解析 AST" 按钮生成语法树</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    注意：这是简化版 AST 演示，完整版需要 tree-sitter-wasm
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-border rounded-lg border p-4">
        <h3 className="mb-2 font-semibold">功能说明</h3>
        <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
          <li>简化版 AST 解析器（用于演示）</li>
          <li>支持解析函数声明、变量声明、返回语句</li>
          <li>可视化语法树结构，包含节点类型和值</li>
          <li>支持复制 AST 为 JSON 格式</li>
          <li>
            完整版 AST 查看器需要集成{' '}
            <a
              href="https://tree-sitter.github.io/tree-sitter/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              tree-sitter-wasm
            </a>{' '}
            和{' '}
            <a
              href="https://reactflow.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              React Flow
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};
