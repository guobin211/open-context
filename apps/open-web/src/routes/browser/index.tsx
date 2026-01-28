import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/browser/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/browser/"!</div>
}
