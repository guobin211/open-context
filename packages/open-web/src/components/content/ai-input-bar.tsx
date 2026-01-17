import { useState } from 'react';
import {
  Quote,
  Paperclip,
  Lightbulb,
  AtSign,
  Zap,
  MessageSquare,
  Code,
  Camera,
  Eraser,
  ArrowUp,
  Blocks
} from 'lucide-react';
import { ContextTag } from './context-tag';
import { ToolbarButton } from './toolbar-button';

export function AIInputBar() {
  const [message, setMessage] = useState('');
  const [contextTags, setContextTags] = useState([{ id: '1', label: 'node' }]);

  const removeTag = (id: string) => {
    setContextTags(contextTags.filter((tag) => tag.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 发送消息逻辑
      console.log('Send message:', message);
      setMessage('');
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-xl bg-gray-100 p-3">
          {/* 上下文标签区 */}
          {contextTags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {contextTags.map((tag) => (
                <ContextTag key={tag.id} label={tag.label} onRemove={() => removeTag(tag.id)} />
              ))}
            </div>
          )}

          {/* 输入框 */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="在这里输入消息，按 Enter 发送"
            className="min-h-15 w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:outline-none"
            rows={2}
          />

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-0.5">
              <ToolbarButton icon={<Quote className="h-4 w-4" />} tooltip="插入引用" />
              <ToolbarButton icon={<Paperclip className="h-4 w-4" />} tooltip="附件" />
              <ToolbarButton
                icon={<Lightbulb className="h-4 w-4" />}
                tooltip="DeepSeek"
                className="text-orange-500 hover:text-orange-600"
              />
              <ToolbarButton
                icon={<span className="text-sm font-bold">G</span>}
                tooltip="Google 搜索"
                className="text-blue-500 hover:text-blue-600"
              />
              <ToolbarButton
                icon={<Blocks className="h-4 w-4" />}
                tooltip="MCP"
                className="text-emerald-500 hover:text-emerald-600"
              />
              <ToolbarButton icon={<AtSign className="h-4 w-4" />} tooltip="@提及" />
              <ToolbarButton icon={<Zap className="h-4 w-4" />} tooltip="快捷操作" />
              <ToolbarButton icon={<MessageSquare className="h-4 w-4" />} tooltip="知识库" />
              <ToolbarButton icon={<Code className="h-4 w-4" />} tooltip="代码" />
              <ToolbarButton icon={<Camera className="h-4 w-4" />} tooltip="截图" />
              <ToolbarButton icon={<Eraser className="h-4 w-4" />} tooltip="清除" />
            </div>

            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-emerald-600 text-white shadow-md transition-transform hover:scale-105">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
