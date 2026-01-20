import { createRootRoute, Outlet } from '@tanstack/react-router';
import { GlobalContextProvider } from '../context/global-context';
import { QueryProvider } from '../context/query-provider';
import { MainLayout } from '../components/layout';

const RootLayout = () => (
  <GlobalContextProvider>
    <QueryProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </QueryProvider>
  </GlobalContextProvider>
);

export const Route = createRootRoute({ component: RootLayout });
