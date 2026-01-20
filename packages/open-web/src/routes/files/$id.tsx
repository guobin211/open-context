import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/files/$id')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/chat/$id"!</div>;
}
