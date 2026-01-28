import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/launcher/')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/launch-pad/"!</div>;
}
