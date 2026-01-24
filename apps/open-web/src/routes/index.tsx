import { createFileRoute } from '@tanstack/react-router';
import { Background } from '@/components/background';

const RouteComponent = () => {
  return (
    <Background>
      <div data-tauri-drag-region className="flex h-full items-center justify-center">
        <h1 className="text-2xl font-semibold text-white">Welcome</h1>
      </div>
    </Background>
  );
};

export const Route = createFileRoute('/')({
  component: RouteComponent
});
