import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function CodeBlock({ code, language = 'python', title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
      {title && (
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-2">
          <span className="text-sm font-medium tracking-wide text-gray-300 uppercase">{title}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? '已复制' : '复制'}</span>
          </button>
        </div>
      )}
      {!title && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 flex items-center gap-1.5 rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      )}
      <pre className="overflow-x-auto p-4">
        <code className={`language-${language} text-sm leading-relaxed text-gray-100`}>{code}</code>
      </pre>
    </div>
  );
}
