import { WelcomePage } from '@/routes/workspace/components/welcome-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/workspace/')({
  component: RouteComponent
});

function RouteComponent() {
  return <WelcomePage />;
}
