# Admin RAG Tests

本目录包含 admin-rag 项目的所有测试用例。

## 测试结构

```
tests/
├── api/                    # API 端点集成测试
│   ├── workspace.test.ts   # Workspace API 测试
│   ├── repo.test.ts        # Repository API 测试
│   ├── index.test.ts       # 索引任务 API 测试
│   ├── query.test.ts       # RAG 查询 API 测试
│   └── graph.test.ts       # 依赖图 API 测试
├── services/               # Service 层单元测试
│   ├── workspace-service.test.ts
│   └── graph-service.test.ts
├── indexers/               # 代码解析器测试
│   └── indexer.test.ts
└── helpers.ts              # 测试辅助函数
```

## 运行测试

### 运行所有测试

```bash
pnpm test
```

### 运行一次性测试（CI 模式）

```bash
pnpm test:run
```

### 监听模式运行测试

```bash
pnpm test:watch
```

### 生成测试覆盖率报告

```bash
pnpm test:coverage
```

### 使用 UI 界面运行测试

```bash
pnpm test:ui
```

## 测试覆盖范围

### API 测试 (tests/api/)

- **Workspace API**: 创建、读取、更新、删除工作空间
- **Repository API**: 仓库管理的完整 CRUD 操作
- **Index API**: 索引任务的启动和状态查询
- **Query API**: 向量搜索和代码查询
- **Graph API**: 依赖关系图的查询和遍历

### Service 层测试 (tests/services/)

- **WorkspaceService**: 工作空间业务逻辑
- **GraphService**: 依赖图服务

### Indexer 测试 (tests/indexers/)

- **Symbol Extraction**: 符号提取（函数、类、变量）
- **Import Extraction**: 导入语句解析
- **Call Extraction**: 函数调用关系
- **Code Chunking**: 代码分块
- **Graph Building**: 依赖图构建

## 测试工具

### 框架和库

- **Vitest**: 测试框架
- **Hono Testing**: Hono 应用测试工具
- **vi.mock**: Mock 工具

### 辅助函数 (helpers.ts)

- `createTestApp()`: 创建测试用的 Hono 应用实例
- `createMockWorkspace()`: 创建 mock 工作空间数据
- `createMockRepo()`: 创建 mock 仓库数据
- `createMockJob()`: 创建 mock 任务数据
- `createMockSymbol()`: 创建 mock 符号数据

## 编写测试

### API 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp } from '../helpers';
import myRoutes from '../../src/api/my-routes';

describe('My API', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.route('/api/v1', myRoutes);
  });

  it('should return 200', async () => {
    const res = await app.request('/api/v1/my-endpoint');
    expect(res.status).toBe(200);
  });
});
```

### Service 测试示例

```typescript
import { describe, it, expect } from 'vitest';
import { MyService } from '../../src/services';

describe('MyService', () => {
  it('should do something', async () => {
    const service = new MyService();
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

## 持续集成

测试应该在以下场景自动运行：

- Git pre-commit hook
- Pull request 检查
- CI/CD pipeline

## 注意事项

1. **隔离性**: 每个测试应该独立，不依赖其他测试的执行顺序
2. **清理**: 使用 `beforeEach` 和 `afterEach` 清理测试状态
3. **覆盖率**: 目标是达到 80% 以上的代码覆盖率
4. **命名**: 测试文件使用 `*.test.ts` 后缀
5. **描述**: 使用清晰的描述语句，说明测试的目的

## 调试测试

### VSCode 调试配置

在 `.vscode/launch.json` 中添加：

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 只运行特定测试

```bash
# 运行特定文件
pnpm test workspace.test.ts

# 运行特定测试套件
pnpm test -t "Workspace API"

# 运行匹配的测试
pnpm test -t "should create"
```

## 贡献指南

添加新功能时，请确保：

1. 为新的 API 端点添加集成测试
2. 为新的 service 方法添加单元测试
3. 确保所有测试通过
4. 保持测试覆盖率不降低

## 资源

- [Vitest 文档](https://vitest.dev/)
- [Hono Testing 指南](https://hono.dev/guides/testing)
- [测试最佳实践](https://testingjavascript.com/)
