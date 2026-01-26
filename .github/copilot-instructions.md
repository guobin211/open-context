# OpenContext 编码规范

## 输出规则

### 禁止无效输出

- 不要写文档说明、README。
- 不要生成测试代码（除非我明确要求）。
- 不要做代码总结、使用说明。
- 不要添加示例代码。

### 拒绝废话

- 不要说“好的，我来帮你...”这类客套话。
- 不要问“是否需要...”，直接根据上下文给最佳方案。
- 不要列举多个方案让我选，直接给最优解。
- 不要重复我的需求。

### 高信噪比交付

**分场景解释策略：**

- **简单修改**（如改变量名、修复小Bug）：零解释，直接给代码。
- **新增功能**：仅在代码块上方用 1-2 句 简述设计思路或技术选型。
- **关键决策**：涉及安全、性能或架构变更时，必须简要说明理由。

**代码呈现：**

- 复杂逻辑优先使用 **代码注释** 代替正文的长篇解释。
- 只输出修改的函数或代码块，严禁输出未修改的上下文代码。

### “思维链”机制 (Chain of Thought)

大模型处理复杂逻辑时需要“打草稿”。让它先简述思路或编写注释，能激活推理过程，显著提高代码准确率。 结论：
这就是为什么要分场景——复杂任务靠解释（注释）保质量，简单任务靠直给省成本。

### 行为准则

- 只做明确要求的事，不要自作主张加功能。
- 不要过度优化（除非要求）。
- 如果需求不清，只问一个最关键的问题，而不是基于假设写一堆代码。

## 一、通用规范

### 文件命名

- TypeScript/JavaScript：kebab-case（`nav-item.tsx`、`sidebar-store.ts`）
- Rust：snake_case（`app_commands.rs`、`app_state.rs`）
- 测试文件：`*.test.ts` 后缀
- 每个目录包含 `index.ts` 作为桶导出

### 标识符命名

- 类/接口/类型：PascalCase（`WorkspaceService`、`NavItemProps`）
- 函数/方法/变量：camelCase（`createWorkspace`）
- React Hooks：`use` 前缀（`useSidebarStore`）
- Rust 函数/变量：snake_case（`get_user_info`）

### 注释规范

- 不使用行尾注释，注释单独成行
- 函数使用 Doc 注释，不标注参数类型
- 仅在必要的逻辑判断处添加注释

### 文件行数

- TypeScript 文件不超过 1000 行，超出需拆分

---

## 二、React 前端（open-web）

### 目录结构

```
src/
├── components/
│   ├── ui/           # shadcn/ui 组件
│   ├── layout/       # 布局组件
│   ├── sidebar/      # 侧边栏组件
│   └── content/      # 内容区组件
├── routes/           # TanStack Router 路由
├── zustand/          # Zustand stores
├── hooks/            # 自定义 hooks
├── lib/              # 工具函数
└── i18n/             # 国际化
```

### 组件模式

```tsx
interface NavItemProps {
  id: string;
  label: string;
  icon: string;
}

export const NavItem: React.FC<NavItemProps> = (props) => {
  const { id, label, icon } = props;
  // hooks 在顶部
  const { activeItemId } = useSidebarStore();

  // 派生状态
  const isActive = activeItemId === id;

  // 事件处理
  const handleClick = () => {};

  return <button onClick={handleClick}>{label}</button>;
};
```

### 导入规范

- 绝对导入：`import { cn } from '@/lib/utils'`
- 导入顺序：外部库 → 内部模块

### 状态管理

- Zustand：客户端全局状态
- React Query：服务端状态和缓存
- useState：组件局部状态

### 样式

- Tailwind CSS 原子类优先
- `cn()` 合并条件类名
- 复杂组件使用 SCSS 模块

---

## 三、Node.js 服务（open-node）

### 目录结构

```
├─ package.json
├─ tsconfig.json
├─ .env
├─ src/
│   ├─ api/
│   ├─ services/
│   ├─ jobs/
│   ├─ db/
│   ├─ indexers/
│   ├─ utils/
│   ├─ types/
│   └─ app.ts
├─ data/
│   ├─ leveldb/
│   └─ logs/
├─ tests/
├─ scripts/
└─ README.md
```

### 服务类模式

```typescript
import { WorkspaceRepository } from '../db';
import { Workspace, CreateWorkspaceDto } from '../types';
import logger from '../utils/logger';

export class WorkspaceService {
  private repo = new WorkspaceRepository();

  async createWorkspace(dto: CreateWorkspaceDto): Promise<Workspace> {
    logger.info({ name: dto.name }, 'Creating workspace');
    const workspace = await this.repo.create(dto);
    logger.info({ id: workspace.id }, 'Workspace created');
    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.repo.findById(id);
  }
}
```

### 导入规范

- 相对导入：`import { logger } from '../utils'`
- Node 内置模块：`import fs from 'node:fs/promises'`

### 文件命名

- 服务：`{name}-service.ts`
- 路由：`{name}-routes.ts`
- 测试：`tests/{module}/{name}.test.ts`

### 返回值约定

- 查询单个：`T | null`
- 查询列表：`T[]`
- 创建/更新：返回完整实体
- 删除：`boolean`

### 日志规范

- pino 结构化日志：`logger.info({ id }, 'Message')`
- 关键操作记录开始和结束

---

## 四、Rust 桌面端（tauri-app）

### 目录结构

- apps/open-app

```
src/
├── main.rs          # 入口
├── lib.rs           # 库入口
├── app_plugins.rs   # 插件
```

### 命名规范

- 模块/函数/变量：snake_case
- 类型/结构体/枚举：PascalCase
- 常量：SCREAMING_SNAKE_CASE

### 代码风格

- 缩进 4 空格
- `cargo fmt` 格式化
- `cargo clippy` 检查

### 错误处理

- `Result<T, E>` + `?` 操作符
- 避免 `.unwrap()`，使用 `.expect("说明")`
- `anyhow` 应用级错误，`thiserror` 库错误

### 注释规范

```rust
//! 模块文档注释

/// 函数文档注释
#[tauri::command]
pub fn ping() -> &'static str {
    "pong"
}
```

---

## 五、TypeScript 类型安全

- 禁止 `any` 类型
- 禁止 `@ts-ignore`、`@ts-expect-error`、`as any`
- 公开方法显式声明返回类型
- Props 接口：`{组件名}Props`
- Promise函数需要catch错误，`fetch().catch(console.error)`

---

## 六、错误处理

- 结构化日志：`logger.info({ id }, 'Message')`
- 服务方法返回 `null` 表示未找到
- 禁止空 catch 块
- 自然传播错误，减少 try/catch 嵌套

---

## 七、Git 提交

- 不自动提交，等待用户明确指示
- 不使用 `--force`、`--amend`（除非用户要求）

---

## 八、禁止模式

- `as any`、`@ts-ignore`（TypeScript）
- 空 catch 块
- 删除失败的测试
- 主动创建 README 或文档文件
- `.unwrap()` 用于可能失败的操作（Rust）
