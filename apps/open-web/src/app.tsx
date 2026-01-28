import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import './i18n';
import './app.css';

// Import generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent' // 预加载用户意图可能访问的路由
});

// Register router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// 初始化多窗口状态同步
// 在应用启动时监听其他窗口的状态变化
React.useEffect(() => {
  import('./storage').then(({ initializeMultiWindowSync }) => {
    const cleanup = initializeMultiWindowSync();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  });
}, []);
