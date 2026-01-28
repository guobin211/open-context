## 1. 规范验证和准备

- [ ] 1.1 验证 TanStack Router 的文件系统路由配置
- [ ] 1.2 检查现有路由结构（launcher、browser、terminal、settings、workspace、playground）
- [ ] 1.3 识别需要调整的组件和状态管理逻辑
- [ ] 1.4 备份当前路由代码（使用 Git 创建分支）

## 2. 路由结构实施

- [ ] 2.1 在 `apps/open-web/src/routes/` 下创建/调整顶层路由文件
  - [ ] 2.1.1 创建或更新 `__root.tsx`（根路由，全局 Providers）
  - [ ] 2.1.2 创建或更新 `index.tsx`（默认重定向到 /launcher）
  - [ ] 2.1.3 创建或更新 `launcher.index.tsx`
  - [ ] 2.1.4 创建或更新 `browser.index.tsx`
  - [ ] 2.1.5 创建或更新 `terminal.index.tsx`
  - [ ] 2.1.6 创建或更新 `settings.index.tsx`
  - [ ] 2.1.7 创建或更新 `workspace.index.tsx`
- [ ] 2.2 配置 TanStack Router 的路由选项
  - [ ] 2.2.1 设置 `defaultPreload: 'intent'` 启用路由预加载
  - [ ] 2.2.2 配置路由导航历史管理
- [ ] 2.3 验证路由文件类型安全（使用 TypeScript 编译检查）

## 3. 状态管理重构

- [ ] 3.1 创建/更新 Zustand stores 管理全局状态
  - [ ] 3.1.1 创建/更新 `app-store.ts`（主题、语言、用户设置）
  - [ ] 3.1.2 确保全局状态在所有路由间同步
  - [ ] 3.1.3 验证状态可序列化为 JSON（多窗口同步）
- [ ] 3.2 为每个路由创建 Context Provider 管理局部状态
  - [ ] 3.2.1 创建 `LauncherContext`（launcher 路由局部状态）
  - [ ] 3.2.2 创建 `BrowserContext`（browser 路由局部状态）
  - [ ] 3.2.3 创建 `TerminalContext`（terminal 路由局部状态）
  - [ ] 3.2.4 创建 `SettingsContext`（settings 路由局部状态）
  - [ ] 3.2.5 创建 `WorkspaceContext`（workspace 路由局部状态）
- [ ] 3.3 实现路由状态保持和恢复逻辑
  - [ ] 3.3.1 在组件卸载前保存状态到临时存储或 Zustand
  - [ ] 3.3.2 在组件挂载时检查并恢复状态
  - [ ] 3.3.3 验证状态在路由切换时保持正确
  - [ ] 3.3.4 使用 logger 记录状态保存和恢复操作
- [ ] 3.4 实现多窗口状态同步
  - [ ] 3.4.1 在 Zustand store 中添加 Tauri 事件发送逻辑（状态变化时广播）
  - [ ] 3.4.2 在组件中监听 `app-state` 事件并更新本地状态
  - [ ] 3.4.3 使用 logger 记录事件发送和接收，便于调试
  - [ ] 3.4.4 测试多窗口状态同步（主窗口切换主题，子窗口同步更新）
  - [ ] 3.4.5 添加错误处理，事件失败时记录警告日志

## 4. 路由导航机制实施

- [ ] 4.1 统一路由导航方式
  - [ ] 4.1.1 替换所有 `window.location.href` 为 `<Link>` 组件
  - [ ] 4.1.2 替换所有 `window.history.push()` 为 `useNavigate()` 钩子
  - [ ] 4.1.3 添加路由导航的类型安全参数传递
- [ ] 4.2 实现路由间上下文传递
  - [ ] 4.2.1 从 launcher 跳转到 workspace 时传递工作区路径
  - [ ] 4.2.2 从 workspace 返回 launcher 时保留工作区状态
  - [ ] 4.2.3 实现快捷键切换路由（如 Ctrl+Shift+T 切换到 terminal）
- [ ] 4.3 验证路由导航功能
  - [ ] 4.3.1 手动测试所有路由间的跳转
  - [ ] 4.3.2 验证参数传递和状态保持
  - [ ] 4.3.3 测试浏览器前进/后退按钮

## 5. Playground 懒加载实现

- [ ] 5.1 实现 Playground 子页面的动态导入
  - [ ] 5.1.1 创建 `playground/[page].tsx` 路由文件
  - [ ] 5.1.2 使用 React.lazy 懒加载所有子页面组件
  - [ ] 5.1.3 配置路由参数类型（`$page: string`）
- [ ] 5.2 添加加载状态和错误处理
  - [ ] 5.2.1 使用 Suspense 包裹懒加载组件
  - [ ] 5.2.2 实现加载中状态的 fallback 组件（Spinner 加载动画）
  - [ ] 5.2.3 添加 ErrorBoundary 处理组件加载失败
- [ ] 5.3 验证懒加载效果
  - [ ] 5.3.1 测试访问 `/playground` 根路径（应显示导航栏）
  - [ ] 5.3.2 测试点击子页面链接（应显示加载状态）
  - [ ] 5.3.3 使用浏览器开发者工具验证代码分割

## 6. 性能优化

- [ ] 6.1 优化路由切换性能
  - [ ] 6.1.1 使用 React.memo 优化路由组件
  - [ ] 6.1.2 对大型组件（如 Monaco Editor）实现懒加载
  - [ ] 6.1.3 使用 TanStack Router 的路由预加载功能
- [ ] 6.2 性能测试和调优
  - [ ] 6.2.1 使用 Lighthouse 测量路由切换性能（目标：< 100ms）
  - [ ] 6.2.2 使用 React DevTools Profiler 分析组件渲染
  - [ ] 6.2.3 测量首屏加载时间（FCP < 1.5s）
  - [ ] 6.2.4 使用 logger 记录路由切换耗时，监控性能瓶颈

## 7. 文档和注释更新

- [ ] 7.1 更新路由相关代码注释
  - [ ] 7.1.1 在 `__root.tsx` 添加路由架构说明
  - [ ] 7.1.2 在各路由文件中添加功能定位注释
  - [ ] 7.1.3 在 playground 路由中添加开发调试用途说明
- [ ] 7.2 更新 AGENTS.md 路由规范说明
  - [ ] 7.2.1 添加路由组织结构章节
  - [ ] 7.2.2 添加状态管理策略章节
  - [ ] 7.2.3 添加路由导航机制章节

## 8. 验证和测试

- [ ] 8.1 功能验证
  - [ ] 8.1.1 验证所有路由可正常访问（/、/launcher、/browser、/terminal、/settings、/workspace、/playground）
  - [ ] 8.1.2 验证路由间导航功能正常
  - [ ] 8.1.3 验证路由参数传递正确
  - [ ] 8.1.4 验证路由状态保持和恢复
  - [ ] 8.1.5 验证主题、语言等全局状态在所有路由间同步
  - [ ] 8.1.6 验证多窗口状态同步（Tauri 事件 + JSON）
- [ ] 8.2 集成测试
  - [ ] 8.2.1 运行 `pnpm dev` 启动所有组件
  - [ ] 8.2.2 手动测试完整的用户流程（launcher → workspace → terminal → settings）
  - [ ] 8.2.3 测试浏览器刷新和前进/后退按钮
- [ ] 8.3 性能验证
  - [ ] 8.3.1 运行 Lighthouse 性能测试（Performance > 90, FCP < 1.5s）
  - [ ] 8.3.2 验证路由切换性能（目标 < 100ms）
  - [ ] 8.3.3 验证 Playground 懒加载效果（初始包体积 < 100KB）

## 9. 代码审查和提交

- [ ] 9.1 代码质量检查
  - [ ] 9.1.1 运行 `pnpm lint:js` 检查代码风格
  - [ ] 9.1.2 运行 `pnpm type-check` 检查类型错误
  - [ ] 9.1.3 运行 `pnpm build:web` 验证构建成功
- [ ] 9.2 提交代码
  - [ ] 9.2.1 提交变更到 Git（使用清晰的 commit message）
  - [ ] 9.2.2 推送到远程仓库
  - [ ] 9.2.3 创建 Pull Request 并关联 refactor-web-routes 提案
