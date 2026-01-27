import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/launch-pad/')({
  component: RouteComponent
});

function RouteComponent() {
  return <div>Hello "/launch-pad/"!</div>;
}
