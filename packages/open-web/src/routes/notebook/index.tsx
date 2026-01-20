import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/notebook/')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/notebook/"!</div>;
}
