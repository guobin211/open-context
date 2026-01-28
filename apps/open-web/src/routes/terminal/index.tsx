import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/terminal/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/terminal/"!</div>
}
