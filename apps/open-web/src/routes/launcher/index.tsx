import { createFileRoute } from '@tanstack/react-router';

/**
 * Launcher 路由
 *
 * 功能定位: 启动器主窗口，提供快速访问各个功能的入口
 * 职责: 显示工作区列表、最近项目、快捷操作、全局搜索
 * 交互: 支持搜索、快速启动、工作区管理等操作
 */
export const Route = createFileRoute('/launcher/')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/launcher/"!</div>;
}
