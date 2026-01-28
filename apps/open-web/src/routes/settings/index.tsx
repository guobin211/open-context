import { createFileRoute } from '@tanstack/react-router';
import { SettingsLayout } from './components/settings-layout';

/**
 * Settings 路由
 *
 * 功能定位: 设置页面，提供应用配置和偏好设置
 * 职责: 主题、语言、快捷键、存储、云服务等配置
 * 交互: 支持配置修改、预览、重置等操作
 */
export const Route = createFileRoute('/settings/')({
  component: RouteComponent
});

function RouteComponent() {
  return <SettingsLayout />;
}
