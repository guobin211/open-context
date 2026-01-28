# Window Service 文档

Tauri 窗口管理服务，提供打开、关闭、显示、隐藏窗口等功能。

## API

| 方法 | 参数 | 返回值 | 描述 |
| ---- | ---- | ---- | ---- |
| `show()` | - | `Promise<void>` | 显示当前窗口 |
| `hide()` | - | `Promise<void>` | 隐藏当前窗口 |
| `close()` | - | `Promise<void>` | 关闭当前窗口 |
| `minimize()` | - | `Promise<void>` | 最小化当前窗口 |
| `maximize()` | - | `Promise<void>` | 最大化/还原当前窗口 |
| `isVisible()` | - | `Promise<boolean>` | 检查窗口是否可见 |
| `isMaximized()` | - | `Promise<boolean>` | 检查窗口是否最大化 |
| `isMinimized()` | - | `Promise<boolean>` | 检查窗口是否最小化 |
| `setTitle(title)` | `title: string` | `Promise<void>` | 设置窗口标题 |
| `setSize(width, height)` | `width: number, height: number` | `Promise<void>` | 设置窗口大小 |
| `setPosition(x, y)` | `x: number, y: number` | `Promise<void>` | 设置窗口位置 |
| `setAlwaysOnTop(alwaysOnTop)` | `alwaysOnTop: boolean` | `Promise<void>` | 设置窗口为始终置顶 |
| `setResizable(resizable)` | `resizable: boolean` | `Promise<void>` | 设置窗口是否可调整大小大小 |
| `setFocus()` | - | `Promise<void>` | 聚焦当前窗口 |
| `startDragging()` | - | `Promise<void>` | 开始拖动窗口（用于自定义标题栏） |

## 使用示例

```tsx
import { windowService } from '@/services';

// 显示窗口
await windowService.show();

// 隐藏窗口
await windowService.hide();

// 关闭窗口
await windowService.close();

// 最小化窗口
await windowService.minimize();

// 最大化/还原窗口
await windowService.maximize();

// 检查窗口状态
const isVisible = await windowService.isVisible();
const isMaximized = await windowService.isMaximized();
const isMinimized = await windowService.isMinimized();

// 设置窗口标题
await windowService.setTitle('新标题');

// 设置窗口大小
await windowService.setSize(800, 600);

// 设置窗口位置
await windowService.setPosition(100, 100);

// 设置窗口为始终置顶
await windowService.setAlwaysOnTop(true);

// 设置窗口是否可调整大小
await windowService.setResizable(false);

// 聚焦窗口
await windowService.setFocus();

// 开始拖动窗口（用于自定义标题栏）
await windowService.startDragging();
```

## React Hook 使用

```tsx
import { windowService } from '@/services';
import { useState } from 'react';

function MyComponent() {
  const [isVisible, setIsVisible] = useState(false);

  const handleShowWindow = async () => {
    await windowService.show();
    setIsVisible(true);
  };

  const handleHideWindow = async () => {
    await windowService.hide();
    setIsVisible(false);
  };

  return (
    <div>
      <button onClick={handleShowWindow}>显示窗口</button>
      <button onClick={handleHideWindow}>隐藏窗口</button>
      <button onClick={() => windowService.close()}>关闭窗口</button>
      <div>窗口状态: {isVisible ? '可见' : '隐藏'}</div>
    </div>
  );
}
```

## 错误处理

所有方法都会捕获错误并抛出，调用方应该使用 try-catch 处理错误：

```tsx
import { windowService } from '@/services';

async function handleWindowAction() {
  try {
    await windowService.show();
  } catch (error) {
    console.error('显示窗口失败:', error);
    // 显示错误提示给用户
  }
}
```

## 注意事项

1. **当前窗口限制**: 当前实现仅针对当前窗口，不支持多窗口管理
2. **Tauri 2.x API**: 使用 Tauri 2.x 的 `@tauri-apps/api/window` 模块
3. **物理坐标**: `setPosition` 和 `setSize` 使用物理坐标
4. **错误处理**: 所有方法都有完整的错误处理和日志记录
