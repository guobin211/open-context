import { useState } from 'react';
import { useSettingsStore } from '../../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { RotateCcw, AlertTriangle, Search } from 'lucide-react';
import { defaultShortcuts as defaultShortcutsImport } from '../../../../lib/default-shortcuts';

interface ConflictDialogProps {
  isOpen: boolean;
  conflictingLabel: string;
  newShortcut: string;
  onReplace: () => void;
  onCancel: () => void;
}

const ConflictDialog = ({ isOpen, conflictingLabel, newShortcut, onReplace, onCancel }: ConflictDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 shrink-0 text-yellow-500" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">快捷键冲突</h3>
            <p className="mt-2 text-sm text-gray-600">
              快捷键 <span className="font-mono font-semibold">{newShortcut}</span> 已被{' '}
              <span className="font-semibold">{conflictingLabel}</span> 使用。
            </p>
            <p className="mt-2 text-sm text-gray-600">是否要替换现有快捷键？</p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={onReplace}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            替换
          </button>
        </div>
      </div>
    </div>
  );
};

const KeyboardInput = ({
  value,
  onChange,
  placeholder,
  hasConflict
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasConflict?: boolean;
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    const keys: string[] = [];

    if (e.ctrlKey) keys.push('CmdOrCtrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey && !e.ctrlKey) keys.push('Cmd');

    const key = e.key;
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      keys.push(key.length === 1 ? key.toUpperCase() : key);
    }

    if (keys.length > 0) {
      onChange(keys.join('+'));
      setIsRecording(false);
    }
  };

  const handleBlur = () => {
    setIsRecording(false);
  };

  return (
    <input
      type="text"
      className={`w-48 rounded-md border px-3 py-2 text-center focus:ring-2 focus:outline-none ${
        hasConflict ? 'border-yellow-500 bg-yellow-50 focus:ring-yellow-500' : 'border-gray-300 focus:ring-blue-500'
      }`}
      value={isRecording ? '按下快捷键...' : value}
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsRecording(true)}
      onBlur={handleBlur}
      readOnly
    />
  );
};

const ShortcutsSettings = () => {
  const { config, setConfig } = useSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [conflictState, setConflictState] = useState<{
    isOpen: boolean;
    currentAction: string;
    conflictingAction: string;
    conflictingLabel: string;
    newShortcut: string;
  } | null>(null);

  const shortcutCategories = [
    {
      title: '文件操作',
      shortcuts: [
        { key: 'file.new', label: '新建文件' },
        { key: 'file.open', label: '打开文件' },
        { key: 'file.save', label: '保存' },
        { key: 'file.saveAs', label: '另存为' },
        { key: 'file.close', label: '关闭' },
        { key: 'file.export', label: '导出' }
      ]
    },
    {
      title: '编辑操作',
      shortcuts: [
        { key: 'edit.undo', label: '撤销' },
        { key: 'edit.redo', label: '重做' },
        { key: 'edit.cut', label: '剪切' },
        { key: 'edit.copy', label: '复制' },
        { key: 'edit.paste', label: '粘贴' },
        { key: 'edit.selectAll', label: '全选' },
        { key: 'edit.find', label: '查找' },
        { key: 'edit.replace', label: '替换' }
      ]
    },
    {
      title: '视图操作',
      shortcuts: [
        { key: 'view.zoomIn', label: '放大' },
        { key: 'view.zoomOut', label: '缩小' },
        { key: 'view.resetZoom', label: '重置缩放' },
        { key: 'view.toggleSidebar', label: '切换侧边栏' },
        { key: 'view.fullScreen', label: '全屏' }
      ]
    },
    {
      title: '应用操作',
      shortcuts: [
        { key: 'app.settings', label: '设置' },
        { key: 'app.quit', label: '退出' },
        { key: 'app.reload', label: '重新加载' }
      ]
    },
    {
      title: 'AI 操作',
      shortcuts: [
        { key: 'ai.quickChat', label: '快速聊天' },
        { key: 'ai.analyzeCode', label: '分析代码' }
      ]
    }
  ];

  const findConflict = (newShortcut: string, currentAction: string) => {
    for (const category of shortcutCategories) {
      for (const shortcut of category.shortcuts) {
        if (
          shortcut.key !== currentAction &&
          config.shortcuts[shortcut.key] === newShortcut &&
          newShortcut.trim() !== ''
        ) {
          return { action: shortcut.key, label: shortcut.label };
        }
      }
    }
    return null;
  };

  const hasConflict = (action: string) => {
    const currentShortcut = config.shortcuts[action];
    if (!currentShortcut || currentShortcut.trim() === '') return false;

    for (const category of shortcutCategories) {
      for (const shortcut of category.shortcuts) {
        if (
          shortcut.key !== action &&
          config.shortcuts[shortcut.key] === currentShortcut &&
          currentShortcut.trim() !== ''
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const updateShortcut = (action: string, newShortcut: string) => {
    const conflict = findConflict(newShortcut, action);
    if (conflict) {
      setConflictState({
        isOpen: true,
        currentAction: action,
        conflictingAction: conflict.action,
        conflictingLabel: conflict.label,
        newShortcut
      });
    } else {
      setConfig({ shortcuts: { ...config.shortcuts, [action]: newShortcut } });
    }
  };

  const handleReplaceConflict = () => {
    if (!conflictState) return;
    const newShortcuts = { ...config.shortcuts };
    newShortcuts[conflictState.conflictingAction] = '';
    newShortcuts[conflictState.currentAction] = conflictState.newShortcut;
    setConfig({ shortcuts: newShortcuts });
    setConflictState(null);
  };

  const handleCancelConflict = () => {
    setConflictState(null);
  };

  const resetToDefault = () => {
    setConfig({ shortcuts: defaultShortcutsImport });
  };

  const filteredCategories = searchQuery.trim()
    ? shortcutCategories
        .map((category) => ({
          ...category,
          shortcuts: category.shortcuts.filter(
            (shortcut) =>
              shortcut.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (config.shortcuts[shortcut.key] || '').toLowerCase().includes(searchQuery.toLowerCase())
          )
        }))
        .filter((category) => category.shortcuts.length > 0)
    : shortcutCategories;

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">快捷键设置</h2>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索快捷键..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pr-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <button
          onClick={resetToDefault}
          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
        >
          <RotateCcw className="h-4 w-4" />
          重置为默认
        </button>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="py-8 text-center text-gray-500">未找到匹配的快捷键</div>
      ) : (
        filteredCategories.map((category, categoryIndex) => (
          <SettingsSection key={categoryIndex} title={category.title}>
            <div className="grid grid-cols-2 gap-4">
              {category.shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-900">{shortcut.label}</span>
                  <div className="flex items-center gap-2">
                    <KeyboardInput
                      value={config.shortcuts[shortcut.key] || ''}
                      onChange={(newShortcut) => updateShortcut(shortcut.key, newShortcut)}
                      hasConflict={hasConflict(shortcut.key)}
                    />
                    {hasConflict(shortcut.key) && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
              ))}
            </div>
          </SettingsSection>
        ))
      )}

      <ConflictDialog
        isOpen={conflictState?.isOpen ?? false}
        conflictingLabel={conflictState?.conflictingLabel ?? ''}
        newShortcut={conflictState?.newShortcut ?? ''}
        onReplace={handleReplaceConflict}
        onCancel={handleCancelConflict}
      />
    </div>
  );
};

export { ShortcutsSettings };
