import { VSCodeLayout } from '@/routes/workspace/components/layout';
import { createFileRoute } from '@tanstack/react-router';

const RouteComponent = () => {
  return <VSCodeLayout />;
};

export const Route = createFileRoute('/workspace/')({
  component: RouteComponent
});
