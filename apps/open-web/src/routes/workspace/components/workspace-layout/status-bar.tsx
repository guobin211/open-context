import { GitBranch, AlertCircle, AlertTriangle, Bell } from 'lucide-react';

export const StatusBar = () => {
  return (
    <div className="flex h-6 items-center justify-between border-t border-gray-200 bg-blue-600 px-3 text-xs text-white">
      {/* 左侧 */}
      <div className="flex items-center gap-3">
        {/* Git 分支 */}
        <div className="flex items-center gap-1">
          <GitBranch className="h-3.5 w-3.5" />
          <span>main*</span>
        </div>

        {/* 同步状态 */}
        <div className="flex items-center gap-1">
          <span>⟳ 0 ↑ 1 ↓</span>
        </div>

        {/* 错误和警告 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>0</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>0</span>
          </div>
        </div>
      </div>

      {/* 右侧 */}
      <div className="flex items-center gap-3">
        <span>Ln 4, Col 22</span>
        <span>UTF-8</span>
        <span>◇</span>
        <span>JavaScript</span>
        <Bell className="h-3.5 w-3.5" />
      </div>
    </div>
  );
};
