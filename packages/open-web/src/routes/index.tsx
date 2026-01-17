import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { MainLayout } from '@/components/layout';
import { DocumentView } from '@/components/content';
import { useDocumentStore, mockDocument } from '@/zustand/document-store';

export const Route = createFileRoute('/')({
  component: RouteComponent
});

function RouteComponent() {
  const { setDocument } = useDocumentStore();

  useEffect(() => {
    // 加载 Mock 数据
    setDocument(mockDocument);
  }, [setDocument]);

  return (
    <MainLayout>
      <DocumentView />
    </MainLayout>
  );
}
