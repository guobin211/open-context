import { useState } from 'react';
import { Mic } from 'lucide-react';

export const AIInputBar = () => {
  const [message, setMessage] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      console.log('Send message:', message);
      setMessage('');
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white px-6 py-3">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
          {/* Mode 标签 */}
          <span className="shrink-0 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">NODE</span>

          {/* 输入框 */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or ask Copilot..."
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />

          {/* 语音按钮 */}
          <button className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            <Mic className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
