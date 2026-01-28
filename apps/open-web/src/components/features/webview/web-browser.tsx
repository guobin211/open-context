import { useState } from 'react';
import { ExternalLink, RotateCw, Home, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebBrowserProps {
  className?: string;
}

export const WebBrowser = ({ className }: WebBrowserProps) => {
  const [url, setUrl] = useState<string>('https://www.example.com');
  const [history, setHistory] = useState<string[]>(['https://www.example.com']);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleNavigate = (newUrl: string) => {
    if (!newUrl.trim()) return;

    let targetUrl = newUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    setLoading(true);
    setUrl(targetUrl);
    setHistory([...history.slice(0, currentIndex + 1), targetUrl]);
    setCurrentIndex(history.slice(0, currentIndex + 1).length);

    setTimeout(() => setLoading(false), 500);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setUrl(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setUrl(history[newIndex]);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const handleLoadI = () => {
    setLoading(false);
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="bg-card border-b p-3">
        <div className="mb-3 flex items-center gap-2">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="bg-muted hover:bg-muted/80 rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title="后退"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleForward}
            disabled={currentIndex === history.length - 1}
            className="bg-muted hover:bg-muted/80 rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            title="前进"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleRefresh}
            className="bg-muted hover:bg-muted/80 rounded p-1.5 transition-colors"
            title="刷新"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <div className="bg-muted flex flex-1 rounded-md">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNavigate(url);
                }
              }}
              className="w-full bg-transparent px-3 py-1.5 text-sm outline-none"
              placeholder="输入 URL 或搜索关键词"
            />
            <button
              onClick={() => handleNavigate(url)}
              className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20 border-l px-3 py-1.5 text-sm transition-colors"
            >
              转到
            </button>
          </div>
          <button
            onClick={() => handleNavigate('https://www.example.com')}
            className="bg-muted hover:bg-muted/80 rounded p-1.5 transition-colors"
            title="主页"
          >
            <Home className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.open(url, '_blank')}
            className="bg-muted hover:bg-muted/80 rounded p-1.5 transition-colors"
            title="在新标签页打开"
          >
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        <p className="text-muted-foreground text-xs">
          基于 iframe 的网页浏览器演示（Tauri WebviewWindow 需要在桌面环境中使用）
        </p>
      </div>

      {loading ? (
        <div className="bg-muted flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="text-muted-foreground text-sm">正在加载...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <iframe
            src={url}
            onLoad={handleLoadI}
            className="h-full w-full border-0"
            title="Web Browser"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        </div>
      )}

      <div className="bg-muted border-t p-2">
        <div className="flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            <span className="font-medium">当前URL:</span> {url}
          </div>
          <div className="text-muted-foreground">
            <span className="font-medium">历史:</span> {currentIndex + 1}/{history.length}
          </div>
        </div>
      </div>
    </div>
  );
};
