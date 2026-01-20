import { createFileRoute } from '@tanstack/react-router';
import { useSidebarChatStore } from '../../storage/sidebar-chat-store';
import { useSidebarStore } from '../../storage/sidebar-store';
import { useEffect } from 'react';

export const Route = createFileRoute('/chat/$id')({
  component: RouteComponent
});

function RouteComponent() {
  const { id } = Route.useParams();
  const { setActiveItem } = useSidebarStore();
  const { conversationGroups } = useSidebarChatStore();

  useEffect(() => {
    setActiveItem(id);
  }, [id, setActiveItem]);

  const conversation = conversationGroups
    .flatMap((group) => group.items)
    .find((item) => item.id === id);

  const isFavorite = conversationGroups
    .find((group) => group.id === 'conversation-favorites')
    ?.items.some((item) => item.id === id);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">会话不存在</h2>
          <p className="mt-2 text-sm text-gray-600">未找到 ID 为 {id} 的会话</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-semibold text-gray-900">{conversation.label}</h1>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">会话详情</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">会话 ID</dt>
                <dd className="mt-1 font-mono text-sm text-gray-900">{conversation.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">会话名称</dt>
                <dd className="mt-1 text-sm text-gray-900">{conversation.label}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">会话状态</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {isFavorite ? (
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                      已收藏
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      普通
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">聊天内容</h2>
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-sm text-gray-600">聊天内容将在此处显示...</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

