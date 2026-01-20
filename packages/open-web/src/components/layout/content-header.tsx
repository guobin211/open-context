import { HelpCircle, Share2 } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '../ui/breadcrumb';
import { useDocumentStore } from '../../storage/document-store';

export function ContentHeader() {
  const { currentDocument, syncStatus } = useDocumentStore();
  const path = currentDocument?.path || [];

  return (
    <div data-tauri-drag-region className="flex h-12 items-center justify-between border-b border-gray-100 px-6">
      <Breadcrumb>
        <BreadcrumbList>
          {path.map((segment, index) => (
            <BreadcrumbItem key={segment}>
              {index < path.length - 1 ? (
                <>
                  <BreadcrumbLink href="#" className="text-gray-500 hover:text-gray-700">
                    {segment}
                  </BreadcrumbLink>
                  <BreadcrumbSeparator />
                </>
              ) : (
                <BreadcrumbPage className="text-gray-900">{segment}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <span
            className={`h-2 w-2 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          />
          <span>{syncStatus === 'synced' ? '已同步' : syncStatus === 'syncing' ? '同步中' : '同步失败'}</span>
        </div>
        <button className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
