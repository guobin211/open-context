# 一、API 设计总览

## 基础约定

- Base URL：`/api/v1`
- Content-Type：`application/json`
- ID：`uuid`（或 ulid）
- 异步任务：统一返回 `job_id`

---

# 二、Workspace 管理

## 1️⃣ 查看 Workspace 列表

```
GET /api/v1/workspaces
```

### Response

```json
{
  "items": [
    {
      "id": "ws_123",
      "name": "backend-platform",
      "repoCount": 5,
      "createdAt": "2026-01-01T10:00:00Z"
    }
  ]
}
```

---

## 2️⃣ 新增 Workspace

```
POST /api/v1/workspaces
```

### Body

```json
{
  "name": "backend-platform",
  "description": "All backend repositories"
}
```

### Response

```json
{
  "id": "ws_123"
}
```

---

## 3️⃣ 查看 Workspace 详情

```
GET /api/v1/workspaces/{workspaceId}
```

---

# 三、Repository 管理

## 4️⃣ 查看 Workspace 下所有 Repo

```
GET /api/v1/workspaces/{workspaceId}/repos
```

### Response

```json
{
  "items": [
    {
      "id": "repo_1",
      "name": "auth-service",
      "url": "git@github.com:org/auth-service.git",
      "indexed": true,
      "lastIndexedCommit": "abc123"
    }
  ]
}
```

---

## 5️⃣ 新增 Repo

```
POST /api/v1/workspaces/{workspaceId}/repos
```

### Body

```json
{
  "name": "auth-service",
  "gitUrl": "git@github.com:org/auth-service.git",
  "branch": "main"
}
```

### Response

```json
{
  "id": "repo_1"
}
```

---

## 6️⃣ 删除 Repo

```
DELETE /api/v1/workspaces/{workspaceId}/repos/{repoId}
```

### 行为

- 删除 repo 元数据
- 删除 Qdrant 中的向量
- 删除图依赖数据

### Response

```json
{
  "status": "deleted"
}
```

---

# 四、索引控制（核心）

## 7️⃣ 开始索引仓库（首次 / 全量）

```
POST /api/v1/repos/{repoId}/index
```

### Body（可选）

```json
{
  "mode": "full"
}
```

### Response（异步）

```json
{
  "jobId": "job_789",
  "status": "queued"
}
```

---

## 8️⃣ 更新索引仓库（增量）

```
POST /api/v1/repos/{repoId}/reindex
```

### 行为

- git fetch + diff
- 仅更新变更文件
- 更新 embedding + 图关系

### Response

```json
{
  "jobId": "job_790"
}
```

---

## 9️⃣ 查看索引任务状态

```
GET /api/v1/jobs/{jobId}
```

### Response

```json
{
  "id": "job_789",
  "type": "index_repo",
  "status": "running",
  "progress": 0.42
}
```

---

# 五、向量查询（Qdrant）

## 🔟 语义查询代码（RAG 核心）

```
POST /api/v1/query/vector
```

### Body

```json
{
  "workspaceId": "ws_123",
  "query": "verify jwt token",
  "topK": 10,
  "filters": {
    "repoIds": ["repo_1"]
  }
}
```

### Response

```json
{
  "matches": [
    {
      "symbolId": "auth.verifyToken",
      "repo": "auth-service",
      "file": "src/token.ts",
      "score": 0.87,
      "code": "function verifyToken(...) { ... }"
    }
  ]
}
```

---

# 六、依赖关系图查询（轻量图）

## 1️⃣1️⃣ 查询符号的直接依赖（OUT）

```
GET /api/v1/graph/deps
```

### Query

```
?symbolId=auth.verifyToken&type=CALLS
```

### Response

```json
{
  "from": "auth.verifyToken",
  "edges": [
    {
      "to": "jwt.verify",
      "type": "CALLS"
    }
  ]
}
```

---

## 1️⃣2️⃣ 查询谁依赖了该符号（IN）

```
GET /api/v1/graph/reverse-deps
```

### Query

```
?symbolId=auth.verifyToken&type=CALLS
```

---

## 1️⃣3️⃣ 多跳依赖查询

```
GET /api/v1/graph/traverse
```

### Query

```
?symbolId=auth.verifyToken&depth=2&type=CALLS
```

### Response

```json
{
  "nodes": ["auth.verifyToken", "jwt.verify"],
  "edges": [{ "from": "auth.verifyToken", "to": "jwt.verify" }]
}
```

---

# 七、向量 + 图联合查询（高级 RAG）

## 1️⃣4️⃣ 语义 + 结构增强查询（推荐）

```
POST /api/v1/query/code
```

### Body

```json
{
  "workspaceId": "ws_123",
  "query": "where is token verified",
  "expandGraph": {
    "type": "CALLS",
    "depth": 1
  }
}
```

### 行为

1. Qdrant 向量召回
2. 图关系扩展上下文
3. 返回合并结果

---

# 八、内部模块映射（方便你实现）

| API       | 模块                   |
| --------- | ---------------------- |
| Workspace | `workspace.service.ts` |
| Repo      | `repo.service.ts`      |
| Index     | `indexer.service.ts`   |
| Vector    | `qdrant.service.ts`    |
| Graph     | `graph.service.ts`     |
| Job       | `job.service.ts`       |

---

# 九、最小实现推荐技术栈

```txt
Hono
├─ Qdrant SDK
├─ simple-git
├─ tree-sitter
├─ graph.file.json (graph)
└─ BullMQ / in-memory job
```
