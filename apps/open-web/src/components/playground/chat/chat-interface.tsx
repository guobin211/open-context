import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    content: '你好！我是 AI 助手，有什么可以帮你的吗？',
    sender: 'assistant',
    timestamp: new Date(Date.now() - 60000)
  },
  {
    id: '2',
    content: '你好！我想了解一下 Open Context 的功能。',
    sender: 'user',
    timestamp: new Date(Date.now() - 50000)
  },
  {
    id: '3',
    content:
      'Open Context 是一个开源的 AI Agent 上下文管理工具，主要功能包括：\n\n1. 💬 对话管理 - 多会话对话、消息历史记录\n2. 📝 笔记系统 - 富文本、Markdown 笔记\n3. 📁 文件管理 - 本地文件夹浏览\n4. 🗂️ 工作空间 - Git 仓库管理\n5. 🔍 RAG 检索 - 向量检索和依赖关系图',
    sender: 'assistant',
    timestamp: new Date(Date.now() - 40000)
  }
];

export const ChatInterface = ({ className }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '这是一个演示界面，实际的 AI 响应需要集成后端服务。',
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-4 py-2',
                  message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div
                  className={cn(
                    'mt-1 text-xs',
                    message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}
                >
                  {message.timestamp.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-border bg-card border-t p-4">
        <div className="mx-auto flex max-w-3xl gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
            className="border-border bg-background focus:ring-primary flex-1 resize-none rounded-lg border px-4 py-2 text-sm focus:ring-2 focus:outline-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
          >
            <Send className="size-4" />
            发送
          </button>
        </div>
      </div>
    </div>
  );
};
