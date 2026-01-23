import { createFileRoute } from '@tanstack/react-router';
import { WelcomePage } from '@/components/welcome';

const RouteComponent = () => {
  return <WelcomePage />;
};

export const Route = createFileRoute('/')({
  component: RouteComponent
});
