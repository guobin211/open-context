import { createRootRoute, Outlet } from '@tanstack/react-router';
import { GlobalContextProvider } from '../context/global-context';
import { QueryProvider } from '../context/query-provider';

/**
 * Root Layout
 *
 * 路由架构说明：
 * - 全局 Providers: GlobalContextProvider, QueryProvider
 * - 顶层路由: launcher, browser, terminal, settings, workspace, playground
 * - 路由预配置: defaultPreload: 'intent' (在 app.tsx 中配置)
 * - 状态管理: Zustand (全局) + React Context (路由局部)
 * - 多窗口同步: Tauri 事件系统 + JSON 序列化
 */
const RootLayout = () => (
  <GlobalContextProvider>
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  </GlobalContextProvider>
);

export const Route = createRootRoute({
  component: RootLayout
});
