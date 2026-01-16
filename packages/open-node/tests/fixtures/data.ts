/**
 * Fixtures for Testing - 统一测试数据管理
 */

export function createMockWorkspace(overrides = {}) {
  return {
    id: 'ws_test_123',
    name: 'test-workspace',
    description: 'Test workspace',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

export function createMockRepo(overrides = {}) {
  return {
    id: 'repo_test_123',
    workspaceId: 'ws_test_123',
    name: 'test-repo',
    url: 'https://github.com/test/repo.git',
    defaultBranch: 'main',
    languageStats: { typescript: 100 },
    lastIndexedCommit: '',
    indexedAt: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides
  };
}

export function createMockJob(overrides = {}) {
  return {
    jobId: 'job_test_123',
    status: 'queued' as const,
    progress: 0,
    ...overrides
  };
}

export function createMockSymbol(overrides = {}) {
  return {
    id: 'symbol_test_123',
    name: 'testFunction',
    type: 'function' as const,
    file: 'src/test.ts',
    line: 10,
    repoId: 'repo_test_123',
    ...overrides
  };
}

export function createMockQueryResult(overrides = {}) {
  return {
    symbolId: 'symbol_test_123',
    score: 0.87,
    code: 'function test() {}',
    file: 'src/test.ts',
    repo: 'test-repo',
    kind: 'function' as const,
    ...overrides
  };
}

export function createMockGraphEdge(overrides = {}) {
  return {
    id: 'edge_test_123',
    from: 'Main.run',
    to: 'helper',
    type: 'CALLS' as const,
    weight: 1,
    ...overrides
  };
}

export function createMockCodeChunk(overrides = {}) {
  return {
    symbolId: 'symbol_test_123',
    workspaceId: 'ws_test_123',
    repoId: 'repo_test_123',
    repoName: 'test-repo',
    filePath: 'src/index.ts',
    commit: 'main',
    language: 'typescript',
    payload: {
      symbol_name: 'testFunction',
      qualified_name: 'testFunction',
      kind: 'function',
      visibility: 'public',
      exported: true,
      code: 'function testFunction() { return 1; }',
      start_line: 1,
      end_line: 3,
      importance: 0.75,
      metadata: {}
    },
    ...overrides
  };
}

export function createMockSymbolData(overrides = {}) {
  return {
    name: 'func1',
    qualifiedName: 'func1',
    kind: 'function' as any,
    visibility: 'public' as any,
    exported: true,
    location: { startLine: 1, endLine: 3 },
    signature: 'function func1()',
    codeChunk: 'function func1() {\n  return 1;\n}',
    ...overrides
  };
}

// Git 测试用例
export const mockGitFiles = `
src/index.ts
src/utils.js
README.md
styles.css
src/components/App.tsx
tests/test.jsx
node_modules/pkg/index.js
`.trim();

export const mockGitEmptyOutput = '';
export const mockGitWhitespaceOutput = '   \n\n  ';

// 代码示例
export const testCodeFunction = `
function testFunction(a: number): string {
  return 'test';
}
`;

export const testCodeClass = `
class TestClass {
  constructor() {}
  testMethod() {}
}
`;

export const testCodeArrow = `
const arrowFunc = (x: number) => x * 2;
`;

export const testCodeExports = `
export function exportedFunc() {}
export default class DefaultClass {}
`;

export const testCodeWithImports = `
import { other } from './other';
class Main {
  run() {
    other();
    this.helper();
  }
  helper() {}
}
`;

export const testCodeMultipleSymbols = `
import { React } from 'react';

class UserService {
  constructor(private api: ApiClient) {}

  async getUser(id: string): Promise<User> {
    return this.api.get<User>(\`/users/\${id}\`);
  }

  validateUser(user: User): boolean {
    return user.id && user.email;
  }
}

export default UserService;
`;

// API 请求体
export const mockWorkspaceCreateBody = {
  name: 'test-workspace',
  description: 'Test workspace'
};

export const mockRepoCreateBody = {
  name: 'test-repo',
  gitUrl: 'https://github.com/test/repo.git',
  branch: 'main'
};

export const mockQueryBody = {
  workspaceId: 'ws_test_123',
  query: 'verify jwt token',
  topK: 10
};

export const mockQueryWithFiltersBody = {
  workspaceId: 'ws_test_123',
  query: 'authentication',
  topK: 5,
  filters: {
    repoIds: ['repo_test_123']
  }
};

export const mockQueryWithGraphBody = {
  workspaceId: 'ws_test_123',
  query: 'where is token verified',
  expandGraph: {
    type: 'CALLS',
    depth: 1
  }
};

export const mockIndexBody = {
  mode: 'full'
};

// 错误响应
export const mockNotFoundResponse = {
  error: 'Resource not found'
};

export const mockErrorResponse = {
  error: 'Internal server error'
};
