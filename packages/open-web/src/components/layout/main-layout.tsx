import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { ContentArea } from './content-area';
import { ExplorerPanel } from './explorer-panel';
import { StatusBar } from './status-bar';
import { TopSearchBar } from './top-search-bar';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* 顶部栏 - 100%宽度 */}
      <TopSearchBar />
      {/* 主体区域 - 左侧栏、内容区、右侧栏 */}
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <ContentArea>{children}</ContentArea>
        <ExplorerPanel />
      </div>
      <StatusBar />
    </div>
  );
};
