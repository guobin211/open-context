import { VSCodeLayout } from '@/routes/workspace/components/layout';
import { createFileRoute } from '@tanstack/react-router';

/**
 * Workspace 路由
 *
 * 功能定位: 工作区页面，提供类似 VS Code 的完整开发环境
 * 职责: 文件浏览器、编辑器、侧边栏、状态栏、终端集成等
 * 交互: 支持多文件编辑、Git 操作、终端集成、调试等功能
 *
 * 路由参数示例:
 * - /workspace/?id=workspace-123 - 通过 id 参数传递工作区 ID
 */
const RouteComponent = () => {
  return <VSCodeLayout />;
};

export const Route = createFileRoute('/workspace/')({
  component: RouteComponent
});
