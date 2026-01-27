import { createFileRoute } from '@tanstack/react-router';
import { SettingsLayout } from './components/settings-layout';

export const Route = createFileRoute('/settings/')({
  component: RouteComponent
});

function RouteComponent() {
  return <SettingsLayout />;
}
