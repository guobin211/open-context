# 技术栈文档

本文档概述 Open-Context 项目使用的技术栈和核心依赖库。

## 架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                     │
│                     (open-app)                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │              React Frontend (open-web)            │   │
│  │  TanStack Router + Zustand + shadcn/ui           │   │
│  └────────────────────┬─────────────────────────────┘   │
│                       │ IPC / WebSocket                  │
│  ┌────────────────────▼─────────────────────────────┐   │
│  │              Rust Backend (Tauri)                 │   │
│  │  SQLite (app.db) + 进程管理                       │   │
│  └────────────────────┬─────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────┘
                        │ HTTP / IPC
┌───────────────────────▼─────────────────────────────────┐
│              Node.js Backend (open-node)                 │
│  Hono + SurrealDB + Qdrant + RAG Pipeline               │
└─────────────────────────────────────────────────────────┘
```

---

## 前端技术栈（open-web）

### 核心框架

| 技术栈          | 版本  | 用途     |
| --------------- | ----- | -------- |
| React           | 19.x  | UI 框架  |
| TypeScript      | 5.8.x | 类型系统 |
| Vite            | 7.x   | 构建工具 |
| TanStack Router | 最新  | 路由管理 |

### 状态管理

| 库             | 用途             |
| -------------- | ---------------- |
| Zustand        | 全局状态管理     |
| TanStack Query | 服务端状态和缓存 |

### UI 组件

| 库           | 用途           |
| ------------ | -------------- |
| shadcn/ui    | UI 组件库      |
| Tailwind CSS | 原子化 CSS     |
| Radix UI     | 无样式组件基础 |

### 开发工具

| 工具     | 用途                |
| -------- | ------------------- |
| oxlint   | 代码检查            |
| prettier | 代码格式化          |
| tsx      | TypeScript 脚本运行 |
| vitest   | 单元测试            |

---

## 桌面端技术栈（open-app）

### Tauri

| 技术栈 | 版本 | 用途         |
| ------ | ---- | ------------ |
| Tauri  | 2.x  | 桌面应用框架 |
| Rust   | 1.x  | 系统编程语言 |

### 数据库

| 库         | 用途              |
| ---------- | ----------------- |
| rusqlite   | SQLite 数据库操作 |
| serde_json | JSON 序列化       |

### 核心功能

- IPC 命令系统
- 事件发射与监听
- 异步任务管理
- 进程管理（Node.js 服务）
- 文件系统操作

---

## Node.js 后端技术栈（open-node）

### 核心框架

| 技术栈            | 版本  | 用途           |
| ----------------- | ----- | -------------- |
| Node.js           | 20.x+ | 运行时         |
| TypeScript        | 5.9.x | 类型系统       |
| Hono              | 4.x   | Web 框架       |
| @hono/node-server | 1.x   | Node.js 适配器 |
| @hono/node-ws     | 1.x   | WebSocket 支持 |

### 数据库

| 库                     | 版本         | 用途                |
| ---------------------- | ------------ | ------------------- |
| better-sqlite3         | 12.x         | SQLite 同步操作     |
| @surrealdb/node        | 1.0.0-beta.3 | 图数据库 + 全文检索 |
| @qdrant/js-client-rest | 1.x          | 向量数据库客户端    |
| @keyv/sqlite           | 4.x          | KV 存储             |
| keyv                   | 5.x          | 统一 KV 接口        |

### AI 与 LangChain

| 库                       | 用途          |
| ------------------------ | ------------- |
| langchain                | 主库          |
| @langchain/core          | 核心抽象      |
| @langchain/community     | 社区集成      |
| @langchain/ollama        | Ollama 集成   |
| @langchain/langgraph     | 图工作流      |
| @langchain/textsplitters | 文本分割      |
| ollama                   | Ollama 客户端 |

### 代码分析

| 库                     | 用途           |
| ---------------------- | -------------- |
| tree-sitter            | AST 解析器     |
| tree-sitter-{language} | 各语言解析器   |
| web-tree-sitter        | WASM 版本      |
| dependency-cruiser     | 依赖分析       |
| madge                  | 模块依赖可视化 |

### 文档处理

| 库                   | 用途                     |
| -------------------- | ------------------------ |
| officeparser         | Office 文档解析          |
| @mozilla/readability | 网页可读性提取           |
| cheerio              | HTML 解析                |
| jsdom                | DOM 操作                 |
| remark               | Markdown 处理            |
| remark-gfm           | GitHub Flavored Markdown |
| remark-mdx           | MDX 支持                 |
| mdast-util-to-string | AST 转字符串             |
| fast-xml-parser      | XML 解析                 |

### 图像与 OCR

| 库                  | 用途          |
| ------------------- | ------------- |
| sharp               | 图像处理      |
| @napi-rs/canvas     | Canvas 绘图   |
| skia-canvas         | Skia 引擎绘图 |
| png-js              | PNG 解码      |
| tesseract.js        | OCR 识别      |
| @napi-rs/system-ocr | 系统 OCR      |

### 工具库

| 库                              | 用途        |
| ------------------------------- | ----------- |
| simple-git                      | Git 操作    |
| glob                            | 文件匹配    |
| csv / csv-parse / csv-stringify | CSV 处理    |
| zod                             | 数据验证    |
| uuid                            | UUID 生成   |
| pretty-bytes                    | 字节格式化  |
| fuzzysort                       | 模糊搜索    |
| @node-rs/jieba                  | 中文分词    |
| @node-rs/crc32                  | CRC32 校验  |
| @node-rs/xxhash                 | xxHash 哈希 |
| @node-rs/argon2                 | 密码哈希    |
| @node-rs/bcrypt                 | bcrypt 哈希 |
| @node-rs/jsonwebtoken           | JWT         |

### 云存储

| 库                            | 用途       |
| ----------------------------- | ---------- |
| @aws-sdk/client-s3            | AWS S3     |
| @aws-sdk/s3-request-presigner | S3 预签名  |
| ali-oss                       | 阿里云 OSS |
| cos-nodejs-sdk-v5             | 腾讯云 COS |

### 任务队列

| 库     | 用途     |
| ------ | -------- |
| bullmq | 任务队列 |

### 日志

| 库          | 用途       |
| ----------- | ---------- |
| pino        | 结构化日志 |
| pino-pretty | 日志美化   |

### 构建与测试

| 工具    | 用途     |
| ------- | -------- |
| esbuild | 构建工具 |
| tsx     | 开发运行 |
| vitest  | 单元测试 |

---

## 数据库技术栈

### SQLite

**用途**：应用核心数据存储

**库**：

- Rust: `rusqlite`
- Node.js: `better-sqlite3`

**存储内容**：

- 工作空间、笔记、文件、链接
- Git 仓库、会话、终端、WebView
- 索引任务、元数据

**特性**：

- WAL 模式
- 双端读写
- 连接池

### SurrealDB

**用途**：图数据库 + 全文检索 + 符号存储

**库**：`@surrealdb/node` (1.0.0-beta.3)

**连接模式**：

- 嵌入式：`file://~/.open-context/database/surrealdb/data.db`
- 服务器：`http://localhost:8000`

**存储内容**：

- 代码符号（symbols 表）
- 图关系（imports/calls/extends/implements/uses/references）
- 全文搜索索引（BM25）

**特性**：

- 原生图查询
- BM25 全文搜索
- 事务支持
- ACID 保证

### Qdrant

**用途**：向量数据库 + 语义检索

**库**：`@qdrant/js-client-rest`

**连接**：`http://localhost:6333`

**Collection**：`code_symbols`

**向量配置**：

- 维度：1024（可配置）
- 距离度量：Cosine

**存储内容**：

- 代码嵌入向量
- 符号元数据（workspace_id, repo_id, symbol_name, etc.）

**特性**：

- 高性能向量搜索
- 过滤查询
- Payload 索引

---

## 开发工具链

### 包管理

| 工具  | 用途           |
| ----- | -------------- |
| pnpm  | Node.js 包管理 |
| cargo | Rust 包管理    |

### 代码质量

| 工具      | 用途                       |
| --------- | -------------------------- |
| oxlint    | JavaScript/TypeScript 检查 |
| clippy    | Rust 代码检查              |
| prettier  | 代码格式化                 |
| cargo fmt | Rust 格式化                |

### 构建工具

| 工具    | 用途             |
| ------- | ---------------- |
| vite    | Web 应用构建     |
| esbuild | Node.js 服务构建 |
| cargo   | Rust 编译        |

---

## 运行时要求

### 前端

- Node.js 22.x+
- pnpm 10.x+

### 桌面端

- Rust 1.90+
- Tauri CLI 2.x

### 后端服务

- Node.js 22.x+
- Qdrant Server（可选，用于向量检索）

---

## 推荐开发环境

### 编辑器

- VS Code / Cursor
- JetBrains RustRover / WebStorm

### 必需插件

- Rust Analyzer
- Prettier
- Tailwind CSS IntelliSense

### 可选工具

- Docker（运行 Qdrant）
- Git
- Ollama（本地 LLM）

---

## 参考文档

- [NODE_BACKEND.md](./NODE_BACKEND.md) - Node.js 后端详细文档
- [APP_TAURI.md](./APP_TAURI.md) - Tauri 桌面端详细文档
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - 数据库架构详细文档
- [SHARED_STORAGE.md](./SHARED_STORAGE.md) - 共享存储规范
