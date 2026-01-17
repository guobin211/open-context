import { Settings } from 'lucide-react';

export function BottomActions() {
  return (
    <div className="border-t border-gray-200 p-3">
      <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100">
        <Settings className="h-4 w-4" />
        <span>系统设置</span>
      </button>
    </div>
  );
}
