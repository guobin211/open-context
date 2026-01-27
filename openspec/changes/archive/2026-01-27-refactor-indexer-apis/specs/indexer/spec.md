## 新增需求

### 需求：单文件索引

系统必须提供 `indexFile(filePath: string, content: string, metadata?: Partial<IndexParams>)` 方法，支持独立索引单个文件。

#### 场景：索引单个 TypeScript 文件

- **当** 调用 `indexer.indexFile('src/utils.ts', 'export function add(a, b) { return a + b; }')`
- **那么** 返回包含符号 `add` 的 `IndexResult`，包含代码块和依赖边

#### 场景：索引单个 Markdown 文件

- **当** 调用 `indexer.indexFile('README.md', '# Title\n\nSome content')`
- **那么** 返回包含标题和段落的 `MarkdownChunk[]`，不包含依赖边

#### 场景：使用自定义元数据

- **当** 调用 `indexer.indexFile('test.ts', 'code', { workspaceId: 'ws-123', repoId: 'repo-456' })`
- **那么** 生成的 `symbolId` 包含指定的 `workspaceId` 和 `repoId`

#### 场景：缺少元数据时使用默认值

- **当** 调用 `indexer.indexFile('test.ts', 'code')`（不传 metadata）
- **那么** 使用虚拟元数据（`workspaceId: 'virtual'`, `repoId: 自动生成`）

---

### 需求：代码片段索引

系统必须提供 `indexContent(content: string, language: SupportLanguage, metadata?: Partial<IndexParams>)` 方法，支持索引纯代码片段（无文件路径）。

#### 场景：索引 JavaScript 代码片段

- **当** 调用 `indexer.indexContent('function hello() {}', 'javascript')`
- **那么** 返回包含符号 `hello` 的 `IndexResult`

#### 场景：索引 Python 代码片段

- **当** 调用 `indexer.indexContent('def greet(): pass', 'python')`
- **那么** 返回包含符号 `greet` 的 `IndexResult`

#### 场景：不支持的语言返回错误

- **当** 调用 `indexer.indexContent('some code', 'unsupported-lang')`
- **那么** 抛出 `UnsupportedLanguageError` 错误

#### 场景：使用虚拟文件路径

- **当** 索引无路径的代码片段
- **那么** `filePath` 字段使用 `<snippet-{timestamp}>` 格式

---

### 需求：Git 仓库索引

系统必须提供 `indexGitRepo(repoPath: string, repoId: string, workspaceId?: string)` 方法，支持索引整个 Git 仓库。

#### 场景：索引本地 Git 仓库

- **当** 调用 `indexer.indexGitRepo('/path/to/repo', 'repo-123', 'ws-456')`
- **那么** 遍历仓库中所有支持的文件，对每个文件调用 `indexFile`

#### 场景：过滤 .gitignore 文件

- **当** 仓库包含 `node_modules/` 且在 `.gitignore` 中
- **那么** 跳过 `node_modules/` 目录，不对其中文件建立索引

#### 场景：返回仓库级统计信息

- **当** 索引完成
- **那么** 返回包含 `totalFiles`, `indexedFiles`, `skippedFiles`, `totalSymbols` 的统计对象

#### 场景：增量索引（仅索引变更文件）

- **当** 传入 `fromCommit` 参数
- **那么** 仅索引自 `fromCommit` 以来变更的文件

---

### 需求：语言检测

系统必须提供 `detectLanguage(filePath: string)` 工具函数，根据文件扩展名自动检测编程语言。

#### 场景：检测 TypeScript 文件

- **当** 调用 `detectLanguage('src/main.ts')`
- **那么** 返回 `'typescript'`

#### 场景：检测 Markdown 文件

- **当** 调用 `detectLanguage('README.md')`
- **那么** 返回 `'markdown'`

#### 场景：不支持的扩展名返回 null

- **当** 调用 `detectLanguage('file.xyz')`
- **那么** 返回 `null`

---

### 需求：API 端点 - 文件索引

系统必须提供 `POST /api/v1/index/file` 端点，接受文件路径和内容，返回索引结果。

#### 场景：成功索引文件

- **当** 发送 `POST /api/v1/index/file` 请求，body 为 `{ "filePath": "test.ts", "content": "code", "metadata": {...} }`
- **那么** 返回 HTTP 200，body 包含 `{ "chunks": [...], "edges": [...] }`

#### 场景：缺少必需参数

- **当** 发送请求但缺少 `filePath` 或 `content`
- **那么** 返回 HTTP 400，错误信息为 `"Missing required fields: filePath, content"`

#### 场景：不支持的文件类型

- **当** `filePath` 为 `file.xyz`（不支持的扩展名）
- **那么** 返回 HTTP 400，错误信息为 `"Unsupported file type: .xyz"`

---

### 需求：API 端点 - 内容索引

系统必须提供 `POST /api/v1/index/content` 端点，接受代码片段和语言类型，返回索引结果。

#### 场景：成功索引代码片段

- **当** 发送 `POST /api/v1/index/content` 请求，body 为 `{ "content": "function test() {}", "language": "javascript" }`
- **那么** 返回 HTTP 200，body 包含 `{ "chunks": [...], "edges": [...] }`

#### 场景：缺少语言参数

- **当** 发送请求但缺少 `language` 参数
- **那么** 返回 HTTP 400，错误信息为 `"Missing required field: language"`

---

### 需求：API 端点 - Git 仓库索引

系统必须提供 `POST /api/v1/index/repo` 端点，接受仓库路径和 ID，返回索引统计。

#### 场景：成功索引仓库

- **当** 发送 `POST /api/v1/index/repo` 请求，body 为 `{ "repoPath": "/path", "repoId": "repo-123" }`
- **那么** 返回 HTTP 200，body 包含 `{ "totalFiles": 50, "indexedFiles": 48, "totalSymbols": 320 }`

#### 场景：仓库路径不存在

- **当** `repoPath` 指向不存在的目录
- **那么** 返回 HTTP 404，错误信息为 `"Repository not found: {path}"`

#### 场景：仓库不是 Git 仓库

- **当** `repoPath` 指向的目录不包含 `.git` 文件夹
- **那么** 返回 HTTP 400，错误信息为 `"Not a git repository: {path}"`

---

### 需求：虚拟索引清理

系统必须提供机制清理虚拟索引数据（`workspaceId === 'virtual'`）。

#### 场景：自动清理过期虚拟索引

- **当** 虚拟索引的 `indexed_at` 时间戳超过配置的 TTL（默认 24 小时）
- **那么** 后台任务自动从数据库删除该索引

#### 场景：手动清理所有虚拟索引

- **当** 调用 `DELETE /api/v1/index/virtual` 端点
- **那么** 删除所有 `workspaceId === 'virtual'` 的索引数据，返回删除数量

---

### 需求：向后兼容

新增 API 禁止破坏现有 workspace 索引功能。

#### 场景：现有 workspace 索引仍可正常工作

- **当** 调用现有 `CommonIndexer.index(params)` 方法
- **那么** 功能不受影响，返回结果与重构前一致

#### 场景：workspace 索引内部复用新 API

- **当** workspace 索引服务调用 `indexGitRepo`
- **那么** 索引逻辑复用细粒度 API，结果与原实现一致
