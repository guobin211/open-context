## 上下文

Open-Context 是一个基于 Tauri 的混合桌面应用，前端使用 React 19 + TanStack Router 构建多页面应用。当前路由系统包括 5 个顶层路由（launcher、browser、terminal、settings、workspace）和一个开发调试路由（playground），但缺少系统性的架构设计和实施规范。

**约束条件：**：

- 必须使用 TanStack Router 文件系统路由
- 必须与 Tauri 桌面应用集成（通过 IPC 通信）
- 必须支持路由状态保持和恢复
- 必须支持主题、语言等全局状态的跨路由和跨窗口同步
- 必须保证路由切换性能（状态切换延迟 < 100ms）
- 不需要路由权限控制（当前版本所有路由对已登录用户开放）
- 使用项目内置的 logger 记录日志（不使用外部性能监控 SDK）

**利益相关者：**

- 前端开发者：需要清晰的路由规范和实现指导
- 用户体验：路由切换流畅，状态保持正确（包括多窗口场景）
- 维护团队：代码可维护性，易于扩展新路由和窗口

## 目标 / 非目标

### 目标

- 建立清晰的路由架构和实施规范
- 定义统一的路由切换和状态管理机制
- 提供详细的实施指导，降低开发成本
- 确保路由系统的性能和可维护性

### 非目标

- 改变 TanStack Router 的底层实现（使用其标准 API）
- 实现复杂的路由守卫系统（当前版本不需要权限控制）
- 重构现有业务逻辑（仅规范路由结构和交互模式）

## 决策

### 决策 1：路由组织结构

**决策**：采用扁平化的顶层路由结构，每个顶层路由独立管理自己的子路由。

```
routes/
├── __root.tsx                 # 根路由，全局 Providers
├── index.tsx                  # 默认重定向到 /launcher
├── launcher.index.tsx         # 启动器主页
├── browser.index.tsx          # 浏览器模式主页
├── terminal.index.tsx         # 终端模式主页
├── settings.index.tsx         # 设置主页
├── workspace.index.tsx         # 工作区主页
└── playground/
    ├── index.tsx              # Playground 入口
    └── [page].tsx             # 懒加载的子页面
```

**理由：**

- TanStack Router 的文件系统路由天然支持扁平化结构
- 独立管理子路由降低耦合，易于维护
- 符合现有代码结构，最小化重构成本

**考虑的替代方案：**

- 深层嵌套结构（如 `/browser/files`）：增加路由配置复杂度，不利于状态管理
- 动态路由生成：灵活性高但降低类型安全性，TanStack Router 不推荐

### 决策 2：状态管理策略

**决策**：使用 Zustand 管理全局状态（主题、语言、用户设置），各路由使用 React Context 管理局部状态。通过 Tauri 事件系统和 JSON 数据实现跨窗口状态同步。

**理由：**

- Zustand 提供轻量级、高性能的全局状态管理
- Context 适合管理路由级别的局部状态，避免全局污染
- Tauri 事件系统支持跨窗口通信，确保多窗口状态同步
- JSON 序列化简化状态传输，避免复杂的数据结构问题
- 符合项目现有架构（已有 sidebar-store、workspace-store 等 Zustand stores）

**多窗口同步实现：**

```typescript
// 在 Zustand store 中监听状态变化，通过 Tauri 事件同步到其他窗口
import { emit, listen } from '@tauri-apps/api/event';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
}

// 主窗口：状态变化时广播
const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  language: 'zh-CN',
  setTheme: (theme) => {
    set({ theme });
    // 通过 Tauri 事件同步到其他窗口
    emit('app-state-changed', { type: 'theme', value: theme });
  },
  setLanguage: (language) => {
    set({ language });
    emit('app-state-changed', { type: 'language', value: language });
  }
}));

// 子窗口：监听状态变化事件
useEffect(() => {
  const unlisten = listen<AppState>('app-state-changed', (event) => {
    const { type, value } = event.payload;
    if (type === 'theme') useAppStore.getState().setTheme(value);
    if (type === 'language') useAppStore.getState().setLanguage(value);
  });
  return () => unlisten.then((fn) => fn());
}, []);
```

**考虑的替代方案：**

- 全局使用 Zustand：状态管理过于集中，难以追踪状态来源
- 路由状态全用 Context：性能开销大，组件重渲染频繁
- 使用 localStorage 同步：仅适合持久化数据，不适合实时状态同步

### 决策 3：路由状态保持

**决策**：使用 TanStack Router 的路由导航历史和 React 组件缓存（KeepAlive 模式）保持路由状态。

**理由：**

- TanStack Router 内置导航历史管理，天然支持状态恢复
- 使用 `react-router-dom` 的 `Link` 和 `useNavigate` 进行无刷新导航
- 对于需要完全保持状态的组件，使用 React 的状态提升 + 条件渲染

**实现方式：**

```typescript
// 在 __root.tsx 中使用路由导航上下文
import { RouterProvider, createRouter } from '@tanstack/react-router';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent' // 预加载用户意图可能访问的路由
});
```

**考虑的替代方案：**

- 使用 localStorage 持久化状态：仅适合持久化数据，不适合临时状态（如编辑器内容）
- 使用 URL 参数传递状态：URL 长度有限，不适合传递复杂数据

### 决策 4：路由导航机制

**决策**：统一使用 TanStack Router 的 Link 组件和 useNavigate 钩子进行路由导航，禁止使用原生 window.location。

**理由：**

- 保持路由状态一致，避免刷新页面
- 类型安全的路由参数传递
- 支持路由预加载和优化

**代码规范：**

```typescript
// ✅ 正确：使用 Link 组件
import { Link } from '@tanstack/react-router'

<Link to="/workspace" params={{ id: workspaceId }}>
  打开工作区
</Link>

// ❌ 错误：使用原生导航
<a href={`/workspace/${workspaceId}`}>  // 刷新页面，丢失状态
```

### 决策 5：Playground 懒加载策略

**决策**：Playground 的所有子页面使用 React.lazy 动态导入，仅在访问时加载对应的组件代码。

**理由：**

- Playground 包含 16+ 子页面，全部加载会导致首屏体积过大（预计 > 2MB）
- 懒加载可以显著减少初始包体积，提升首屏性能
- TanStack Router 支持路由级别的代码分割

**实现方式：**

```typescript
// playground/[page].tsx
import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

const pageComponents = {
  'markdown': lazy(() => import('./pages/markdown')),
  'code-editor': lazy(() => import('./pages/code-editor')),
  // ...其他子页面
}

export const Route = createFileRoute('/playground/$page')({
  component: RouteComponent,
})

function RouteComponent() {
  const { page } = Route.useParams()

  const Component = pageComponents[page as keyof typeof pageComponents]

  return (
    <Suspense fallback={<div className="spinner">加载中...</div>}>
      <Component />
    </Suspense>
  )
}
```

**考虑的替代方案：**

- 全部静态导入：初始包体积过大，不符合性能要求
- 基于路由的懒加载（TanStack Router 的 `lazy`）：与 React.lazy 功能相同，选择更熟悉的方案

## 风险 / 权衡

### 风险 1：路由状态丢失

**场景**：用户在 workspace 路由编辑文件，切换到 terminal 路由执行命令，返回时文件内容丢失。

**缓解措施：**

- 使用 Zustand 管理编辑器状态，确保状态跨路由保持
- 在 workspace 组件卸载前保存状态到临时存储
- 返回时检查并恢复状态
- 使用 logger 记录状态保存和恢复的操作，便于调试

**权衡**：增加少量状态管理复杂度，但确保用户体验。

### 风险 2：多窗口状态同步失败

**场景**：用户在主窗口切换主题，子窗口未同步更新，导致 UI 不一致。

**缓解措施：**

- 使用 Tauri 事件系统在窗口间广播状态变化
- 每个窗口监听 `app-state-changed` 事件并更新本地状态
- 使用 logger 记录事件发送和接收，便于调试同步问题
- 添加错误处理，事件失败时重试或降级到手动同步

**权衡**：增加事件处理逻辑，但确保多窗口体验一致。

### 风险 3：路由切换性能问题

**场景**：从 launcher 切换到 workspace 时，加载大量组件导致卡顿（> 500ms）。

**缓解措施：**

- 使用 TanStack Router 的 `defaultPreload: 'intent'` 预加载可能访问的路由
- 对大型组件（如 Monaco Editor）使用懒加载
- 使用 React.memo 避免不必要的重渲染
- 使用 logger 记录路由切换耗时，监控性能瓶颈

**权衡**：增加代码复杂度，但显著提升性能。

### 风险 4：JSON 序列化数据丢失

**场景**：复杂对象（如函数、循环引用）无法通过 JSON 序列化，导致状态同步失败。

**缓解措施：**

- 在 Zustand store 中明确可序列化状态（仅存储 JSON 兼容数据）
- 对于不可序列化数据（如函数、Symbol），使用其他机制（如闭包、依赖注入）
- 添加序列化/反序列化验证，失败时记录警告日志

**权衡**：限制状态数据类型，但简化多窗口通信。

## 迁移计划

### 阶段 1：规范验证（1 天）

- [ ] 验证 TanStack Router 的文件系统路由支持
- [ ] 确认现有路由结构符合新规范
- [ ] 评估需要调整的组件和状态管理逻辑

### 阶段 2：路由结构调整（2 天）

- [ ] 在 `routes/` 目录下创建/调整顶层路由文件
- [ ] 配置 TanStack Router 的 `defaultPreload` 和其他优化选项
- [ ] 更新 `__root.tsx` 以支持路由导航和历史管理

### 阶段 3：状态管理重构（2 天）

- [ ] 将全局状态（主题、语言）迁移到 Zustand stores
- [ ] 为每个路由创建 Context 管 fancier 局部状态
- [ ] 实现路由状态保持和恢复逻辑
- [ ] 实现多窗口状态同步（Tauri 事件 + JSON）

### 阶段 4：Playground 懒加载实现（1 天）

- [ ] 实现 Playground 子页面的 React.lazy 动态导入
- [ ] 添加 Suspense fallback 组件（加载状态、错误边界）
- [ ] 验证懒加载的性能提升效果

### 阶段 5：测试和验证（2 天）

- [ ] 手动测试各路由的导航和切换功能
- [ ] 使用 Lighthouse 测量路由切换性能（目标：< 100ms）
- [ ] 编写单元测试验证路由参数和状态管理

### 回滚计划

- 如遇严重问题，使用 Git 回滚到变更前的代码
- 保留原路由结构作为备份，直到新结构完全稳定

## 待决问题

暂无待决问题，所有关键决策已明确。

## 参考资料

- [TanStack Router 官方文档](https://tanstack.com/router/latest)
- [React 官方文档 - Concurrent Mode](https://react.dev/blog/2022/03/29/react-v18#what-is-concurrent-react)
- [Zustand 官方文档](https://zustand-demo.pmnd.rs/)
