import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/chat/$id')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/chat/$id"!</div>;
}
