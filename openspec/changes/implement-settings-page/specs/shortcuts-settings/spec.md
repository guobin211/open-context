# 功能规范：快捷键设置

## 概述

快捷键设置页面允许用户自定义应用的键盘快捷键，支持快捷键录制、冲突检测和预设方案。

## 新增需求

### 需求：用户可以自定义快捷键

应用**必须**提供快捷键自定义功能，用户**必须**能够为应用的各种操作自定义键盘快捷键。

#### 场景：用户修改"保存文件"快捷键

**操作步骤**：

1. 用户在快捷键列表中找到"保存文件"
2. 点击当前快捷键显示区域（显示"Ctrl+S"）
3. 输入框进入监听模式（提示"按下新的快捷键..."）
4. 用户按下 Cmd+S（macOS）或 Ctrl+Shift+S
5. 系统检测无冲突
6. 快捷键更新为新值

**预期结果**：

- 快捷键立即生效
- 配置自动保存

**边界情况**：

- 用户按下单个修饰键（Ctrl、Shift）：不记录，等待完整组合键
- 用户按下 Escape：取消修改
- 用户按下与其他操作冲突的快捷键：显示冲突警告

### 需求：用户可以解决快捷键冲突

应用**必须**提供快捷键冲突检测和解决功能，当用户设置的快捷键与现有快捷键冲突时，**必须**提示用户并提供解决方案。

#### 场景：用户设置的快捷键与现有快捷键冲突

**操作步骤**：

1. 用户尝试将"新建笔记"快捷键设为 Ctrl+N
2. 系统检测到"新建工作空间"已使用 Ctrl+N
3. 显示冲突对话框：
   - "快捷键 Ctrl+N 已被'新建工作空间'使用"
   - [覆盖并清除冲突] [取消]
4. 用户选择"覆盖并清除冲突"

**预期结果**：

- "新建笔记"快捷键设为 Ctrl+N
- "新建工作空间"快捷键被清空（显示"未设置"）
- 显示提示："已清除'新建工作空间'的快捷键"

### 需求：用户可以搜索快捷键

应用**必须**提供快捷键搜索功能，用户**必须**能够通过搜索快速找到特定操作的快捷键。

#### 场景：用户搜索特定操作的快捷键

**操作步骤**：

1. 用户在搜索框输入"保存"
2. 快捷键列表仅显示包含"保存"的操作：
   - 保存文件（Ctrl+S）
   - 保存所有（Ctrl+Shift+S）

**预期结果**：

- 列表实时过滤
- 高亮匹配的文本

### 需求：用户可以重置快捷键

应用**必须**提供快捷键重置功能，用户**必须**能够将单个或所有快捷键重置为默认值。

#### 场景：用户重置单个快捷键

**操作步骤**：

1. 用户点击"保存文件"旁的"重置"按钮
2. 系统提示："确认重置为默认快捷键 Ctrl+S？"
3. 用户确认

**预期结果**：

- 快捷键恢复为 Ctrl+S

#### 场景：用户重置所有快捷键

**操作步骤**：

1. 用户点击页面顶部的"重置所有快捷键"按钮
2. 系统提示："确认重置所有快捷键为默认值？此操作不可撤销。"
3. 用户确认

**预期结果**：

- 所有快捷键恢复为默认值
- 显示成功提示

## UI 布局

```
┌─────────────────────────────────────────────────┐
│  快捷键设置          [搜索: _______] [重置所有]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  编辑器                                          │
│  ┌───────────────────────────────────────────┐ │
│  │ 保存文件                   Ctrl+S   [重置] │ │
│  │ 撤销                       Ctrl+Z   [重置] │ │
│  │ 重做                       Ctrl+Y   [重置] │ │
│  │ 查找                       Ctrl+F   [重置] │ │
│  │ 替换                    Ctrl+H   [重置]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  工作空间                                        │
│  ┌───────────────────────────────────────────┐ │
│  │ 新建工作空间              未设置     [重置] │ │
│  │ 切换工作空间          Ctrl+Tab   [重置]    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  笔记                                            │
│  ┌───────────────────────────────────────────┐ │
│  │ 新建笔记                   Ctrl+N   [重置] │ │
│  │ 删除笔记                   Delete   [重置] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  全局                                            │
│  ┌───────────────────────────────────────────┐ │
│  │ 打开设置                 Ctrl+,     [重置] │ │
│  │ 显示/隐藏窗口          Ctrl+Shift+H [重置] │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 技术实现

### 类型定义

```typescript
interface ShortcutConfig {
  action: string; // 如 'editor.save'
  label: string; // 如 '保存文件'
  category: 'editor' | 'workspace' | 'notebook' | 'global';
  keys: string; // 如 'Ctrl+S'
  defaultKeys: string;
}

type ShortcutsMap = Record<string, ShortcutConfig>;
```

### 快捷键录制组件

```typescript
const KeyboardInput: React.FC<KeyboardInputProps> = ({ value, onChange, onConflict }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();

    // 按下 Escape 取消
    if (e.key === 'Escape') {
      setIsRecording(false);
      return;
    }

    // 构建快捷键字符串
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) keys.push(isMac ? 'Cmd' : 'Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keys.push(e.key.toUpperCase());
    }

    if (keys.length > 1) {
      const newKeys = keys.join('+');
      setRecordedKeys(newKeys);

      // 检测冲突
      const conflicts = detectConflicts(shortcuts, action, newKeys);
      if (conflicts.length > 0) {
        onConflict?.(conflicts);
      } else {
        onChange(newKeys);
        setIsRecording(false);
      }
    }
  };

  return (
    <input
      value={isRecording ? '按下快捷键...' : value}
      onFocus={() => setIsRecording(true)}
      onKeyDown={handleKeyDown}
      readOnly
    />
  );
};
```

### 冲突检测

```typescript
const detectConflicts = (shortcuts: ShortcutsMap, currentAction: string, newKeys: string): string[] => {
  const conflicts: string[] = [];
  for (const [action, config] of Object.entries(shortcuts)) {
    if (action !== currentAction && config.keys === newKeys) {
      conflicts.push(config.label);
    }
  }
  return conflicts;
};
```

## 数据验证

- 快捷键必须包含至少一个修饰键（Ctrl/Cmd、Shift、Alt）
- 不允许单独的功能键（F1-F12 除外）
- 保留快捷键不可修改（如 Ctrl+C、Ctrl+V）

## 默认快捷键列表

```typescript
// lib/default-shortcuts.ts
export const DEFAULT_SHORTCUTS: ShortcutsMap = {
  'editor.save': {
    action: 'editor.save',
    label: '保存文件',
    category: 'editor',
    keys: 'Ctrl+S',
    defaultKeys: 'Ctrl+S'
  },
  'editor.undo': {
    action: 'editor.undo',
    label: '撤销',
    category: 'editor',
    keys: 'Ctrl+Z',
    defaultKeys: 'Ctrl+Z'
  }
  // ... 30+ 个快捷键
};
```

## 相关功能

- **全局快捷键监听**：需要在主进程（Tauri）中注册全局快捷键
- **编辑器集成**：Monaco Editor 和 Tiptap 需要响应自定义快捷键
