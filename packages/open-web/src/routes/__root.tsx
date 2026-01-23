import { createRootRoute, Outlet } from '@tanstack/react-router';
import { GlobalContextProvider } from '../context/global-context';
import { QueryProvider } from '../context/query-provider';

const RootLayout = () => (
  <GlobalContextProvider>
    <QueryProvider>
      <Outlet />
    </QueryProvider>
  </GlobalContextProvider>
);

export const Route = createRootRoute({ component: RootLayout });
