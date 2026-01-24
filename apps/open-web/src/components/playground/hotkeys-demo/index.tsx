import { useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

interface HotkeyLog {
  id: number;
  keys: string;
  description: string;
  timestamp: Date;
}

export const HotkeysDemo = () => {
  const [logs, setLogs] = useState<HotkeyLog[]>([]);
  const [counter, setCounter] = useState(0);

  const addLog = (keys: string, description: string) => {
    setLogs((prev) => [{ id: Date.now(), keys, description, timestamp: new Date() }, ...prev.slice(0, 19)]);
  };

  useHotkeys('ctrl+s, meta+s', (e) => {
    e.preventDefault();
    addLog('Ctrl/Cmd + S', '保存');
  });

  useHotkeys('ctrl+z, meta+z', (e) => {
    e.preventDefault();
    addLog('Ctrl/Cmd + Z', '撤销');
  });

  useHotkeys('ctrl+shift+z, meta+shift+z', (e) => {
    e.preventDefault();
    addLog('Ctrl/Cmd + Shift + Z', '重做');
  });

  useHotkeys('ctrl+c, meta+c', () => {
    addLog('Ctrl/Cmd + C', '复制');
  });

  useHotkeys('ctrl+v, meta+v', () => {
    addLog('Ctrl/Cmd + V', '粘贴');
  });

  useHotkeys('escape', () => {
    addLog('Escape', '取消/关闭');
  });

  useHotkeys('up', () => {
    setCounter((c) => c + 1);
    addLog('↑', '向上 (+1)');
  });

  useHotkeys('down', () => {
    setCounter((c) => c - 1);
    addLog('↓', '向下 (-1)');
  });

  useHotkeys('space', (e) => {
    e.preventDefault();
    addLog('Space', '空格');
  });

  return (
    <div className="flex h-full gap-6 p-4">
      <div className="flex w-1/2 flex-col gap-4">
        <h3 className="font-medium">支持的快捷键</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between rounded border p-2">
            <span>Ctrl/Cmd + S</span>
            <span className="text-muted-foreground">保存</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Ctrl/Cmd + Z</span>
            <span className="text-muted-foreground">撤销</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Ctrl/Cmd + Shift + Z</span>
            <span className="text-muted-foreground">重做</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Ctrl/Cmd + C</span>
            <span className="text-muted-foreground">复制</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Ctrl/Cmd + V</span>
            <span className="text-muted-foreground">粘贴</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Escape</span>
            <span className="text-muted-foreground">取消</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>↑ / ↓</span>
            <span className="text-muted-foreground">计数器增减</span>
          </div>
          <div className="flex justify-between rounded border p-2">
            <span>Space</span>
            <span className="text-muted-foreground">空格</span>
          </div>
        </div>

        <div className="bg-primary/10 rounded-lg p-4 text-center">
          <div className="text-muted-foreground text-sm">计数器 (使用 ↑↓ 控制)</div>
          <div className="text-4xl font-bold">{counter}</div>
        </div>
      </div>

      <div className="flex w-1/2 flex-col gap-2">
        <h3 className="font-medium">操作日志</h3>
        <div className="flex-1 space-y-1 overflow-auto rounded-lg border p-2">
          {logs.length === 0 ? (
            <p className="text-muted-foreground p-4 text-center text-sm">按下快捷键查看日志</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-muted flex items-center justify-between rounded p-2 text-sm">
                <span>
                  <code className="bg-background mr-2 rounded px-1">{log.keys}</code>
                  {log.description}
                </span>
                <span className="text-muted-foreground text-xs">{log.timestamp.toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
