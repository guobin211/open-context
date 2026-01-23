import { randomUUID } from 'crypto';

export function generateUUID(): string {
  return randomUUID();
}

export function generateSymbolId(params: {
  workspaceId: string;
  repoId: string;
  filePath: string;
  symbolName: string;
}): string {
  return `${params.workspaceId}/${params.repoId}/${params.filePath}#${params.symbolName}`;
}

export function parseSymbolId(symbolId: string): {
  workspaceId: string;
  repoId: string;
  filePath: string;
  symbolName: string;
} | null {
  const match = symbolId.match(/^(.+?)\/(.+?)\/(.+?)#(.+)$/);
  if (!match) return null;

  return {
    workspaceId: match[1],
    repoId: match[2],
    filePath: match[3],
    symbolName: match[4]
  };
}
