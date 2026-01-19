# Tauri 事件系统文档

## 概述

Open-Context 应用的事件系统提供了完整的前后端通信机制，支持多窗口实例管理。该系统包括：

- **Rust 后端** (`src/app_events.rs`, `src/app_event_emitter.rs`)：事件定义和发射器
- **TypeScript 类型** (`packages/open-web/src/types/app-events.types.ts`)：前端类型定义
- **React Hooks** (`packages/open-web/src/hooks/use-app-events.ts`)：简化的事件监听接口

## 架构设计

### 核心特性

1. **多窗口支持**：通过 `WindowId` 区分不同窗口实例
2. **类型安全**：前后端类型完全同步
3. **分类清晰**：事件按功能分为 6 大类
4. **易于扩展**：支持自定义事件类型
5. **时间戳记录**：所有事件自动包含时间戳

### 事件分类

| 类别         | 描述                       | 示例事件                                                     |
| ------------ | -------------------------- | ------------------------------------------------------------ |
| 应用生命周期 | 应用启动、就绪、退出等     | `app:started`, `app:ready`, `app:quit`                       |
| 窗口管理     | 窗口创建、聚焦、调整大小等 | `window:created`, `window:focused`, `window:resized`         |
| 应用状态     | 主题、语言、全局状态变化   | `theme:changed`, `locale:changed`, `app_state:changed`       |
| 服务管理     | 后端服务启动、停止、错误   | `service:started`, `service:stopped`, `service:error`        |
| 系统事件     | 通知、更新、网络状态       | `notification`, `update:available`, `network:status_changed` |
| 自定义事件   | 业务特定事件               | 任意自定义事件名                                             |

## 后端使用（Rust）

### 1. 基本事件创建

```rust
use open_context_lib::app_events::{AppEvent, WindowId};

// 应用就绪事件
let event = AppEvent::AppReady {
    timestamp: AppEvent::now(),
};

// 窗口创建事件
let event = AppEvent::WindowCreated {
    window_id: WindowId::new("main-window"),
    label: "Main Window".to_string(),
    timestamp: AppEvent::now(),
};
```

### 2. 发送事件

```rust
use open_context_lib::{EventEmitter, AppEvent, WindowId};
use tauri::{AppHandle, Manager};

fn send_events(app: &AppHandle) -> tauri::Result<()> {
    let emitter = EventEmitter::new(app.clone());

    // 发送全局事件（所有窗口）
    let event = AppEvent::AppReady {
        timestamp: AppEvent::now(),
    };
    emitter.emit_global(&event)?;

    // 发送到特定窗口
    let window_id = WindowId::new("settings");
    let event = AppEvent::WindowFocused {
        window_id: window_id.clone(),
        timestamp: AppEvent::now(),
    };
    emitter.emit_to_window(&window_id, &event)?;

    // 智能发送（自动判断）
    emitter.emit(&event)?;

    Ok(())
}
```

### 3. 注册窗口事件监听器

```rust
use tauri::WebviewWindow;
use open_context_lib::EventListener;

fn setup_window(window: &WebviewWindow) {
    // 自动监听窗口事件并发送到前端
    EventListener::setup_window_listeners(window);
}
```

### 4. 在 Tauri 构建器中集成

```rust
use open_context_lib::{EventEmitter, AppEvent};
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // 初始化事件发射器
            let emitter = EventEmitter::new(app.handle().clone());
            app.manage(emitter);

            // 发送应用启动事件
            let event = AppEvent::AppStarted {
                version: app.package_info().version.to_string(),
                timestamp: AppEvent::now(),
            };
            if let Some(emitter) = app.try_state::<EventEmitter>() {
                let _ = emitter.emit_global(&event);
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            // 窗口事件会自动通过 EventListener 处理
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 前端使用（React/TypeScript）

### 1. 基本事件监听

```typescript
import { useAppEvent } from '@/hooks/use-app-events';
import type { AppReadyPayload } from '@/types/app-events.types';

function MyComponent() {
  // 监听应用就绪事件
  useAppEvent<AppReadyPayload>('app:ready', (payload) => {
    console.log('App ready at:', new Date(payload.timestamp));
  });

  return <div>My Component</div>;
}
```

### 2. 使用专门的 Hooks

```typescript
import {
  useAppReady,
  useThemeEvent,
  useLocaleEvent,
  useWindowFocus,
  useServiceStatus,
  useNotifications,
  useUpdateCheck,
  useNetworkStatus,
} from '@/hooks/use-app-events';

function Dashboard() {
  // 应用就绪回调
  useAppReady((payload) => {
    console.log('App is ready!');
  });

  // 自动追踪主题
  const theme = useThemeEvent('system');

  // 自动追踪语言
  const locale = useLocaleEvent('en-US');

  // 窗口聚焦状态
  const isWindowFocused = useWindowFocus();

  // 服务状态
  const nodeServer = useServiceStatus('node-server');
  const { isRunning, port, error } = nodeServer;

  // 通知管理
  const { notifications, clearNotifications, removeNotification } = useNotifications();

  // 更新检查
  const { updateAvailable, updateDownloaded } = useUpdateCheck();

  // 网络状态
  const isOnline = useNetworkStatus();

  return (
    <div>
      <p>Theme: {theme}</p>
      <p>Locale: {locale}</p>
      <p>Window Focused: {isWindowFocused ? 'Yes' : 'No'}</p>
      <p>Node Server: {isRunning ? `Running on ${port}` : 'Stopped'}</p>
      {error && <p>Error: {error}</p>}
      <p>Online: {isOnline ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. 过滤特定窗口的事件

```typescript
import { useFilteredEvent } from '@/hooks/use-app-events';
import type { WindowFocusedPayload } from '@/types/app-events.types';

function MyWindow() {
  const myWindowId = 'settings-window';

  // 只监听当前窗口的聚焦事件
  useFilteredEvent<WindowFocusedPayload>(
    'window:focused',
    (payload) => payload.window_id === myWindowId,
    (payload) => {
      console.log('My window gained focus');
    }
  );

  return <div>Settings Window</div>;
}
```

### 4. 监听多个事件

```typescript
import { useMultipleEvents } from '@/hooks/use-app-events';

function App() {
  useMultipleEvents([
    {
      name: 'app:ready',
      handler: (payload) => console.log('App ready:', payload),
    },
    {
      name: 'service:started',
      handler: (payload) => console.log('Service started:', payload),
    },
    {
      name: 'theme:changed',
      handler: (payload) => console.log('Theme changed:', payload),
    },
  ]);

  return <div>App</div>;
}
```

### 5. 类型安全的事件处理

```typescript
import { APP_EVENT_NAMES } from '@/types/app-events.types';
import type { ThemeChangedPayload } from '@/types/app-events.types';

function ThemeToggle() {
  useAppEvent<ThemeChangedPayload>(
    APP_EVENT_NAMES.THEME_CHANGED,
    (payload) => {
      // payload 自动推断为 ThemeChangedPayload
      console.log('New theme:', payload.theme);
    }
  );

  return <button>Toggle Theme</button>;
}
```

## 事件参考

### 应用生命周期事件

| 事件名          | 负载类型                                 | 描述                       |
| --------------- | ---------------------------------------- | -------------------------- |
| `app:started`   | `{ version: string, timestamp: number }` | 应用启动                   |
| `app:ready`     | `{ timestamp: number }`                  | 应用就绪（所有初始化完成） |
| `app:will_quit` | `{ timestamp: number }`                  | 应用即将退出               |
| `app:quit`      | `{ timestamp: number }`                  | 应用已退出                 |

### 窗口事件

| 事件名             | 负载类型                                  | 描述         |
| ------------------ | ----------------------------------------- | ------------ |
| `window:created`   | `{ window_id, label, timestamp }`         | 窗口创建     |
| `window:ready`     | `{ window_id, timestamp }`                | 窗口就绪     |
| `window:focused`   | `{ window_id, timestamp }`                | 窗口聚焦     |
| `window:blurred`   | `{ window_id, timestamp }`                | 窗口失焦     |
| `window:moved`     | `{ window_id, x, y, timestamp }`          | 窗口移动     |
| `window:resized`   | `{ window_id, width, height, timestamp }` | 窗口调整大小 |
| `window:minimized` | `{ window_id, timestamp }`                | 窗口最小化   |
| `window:maximized` | `{ window_id, timestamp }`                | 窗口最大化   |
| `window:closed`    | `{ window_id, timestamp }`                | 窗口关闭     |

### 应用状态事件

| 事件名              | 负载类型                                          | 描述         |
| ------------------- | ------------------------------------------------- | ------------ |
| `app_state:changed` | `{ old_state, new_state, timestamp }`             | 应用状态变化 |
| `theme:changed`     | `{ theme: 'light'\|'dark'\|'system', timestamp }` | 主题变化     |
| `locale:changed`    | `{ locale: string, timestamp }`                   | 语言变化     |

### 服务事件

| 事件名            | 负载类型                              | 描述     |
| ----------------- | ------------------------------------- | -------- |
| `service:started` | `{ service_name, port?, timestamp }`  | 服务启动 |
| `service:stopped` | `{ service_name, reason, timestamp }` | 服务停止 |
| `service:error`   | `{ service_name, error, timestamp }`  | 服务错误 |

### 系统事件

| 事件名                   | 负载类型                                 | 描述         |
| ------------------------ | ---------------------------------------- | ------------ |
| `notification`           | `{ title, body, level, timestamp }`      | 系统通知     |
| `update:available`       | `{ version, release_notes?, timestamp }` | 更新可用     |
| `update:downloaded`      | `{ version, timestamp }`                 | 更新已下载   |
| `network:status_changed` | `{ online: boolean, timestamp }`         | 网络状态变化 |

## 自定义事件

### 后端发送自定义事件

```rust
use serde_json::json;

let event = AppEvent::Custom {
    name: "code:indexed".to_string(),
    payload: json!({
        "repo_id": "my-repo",
        "files_indexed": 150,
        "symbols_extracted": 1250
    }),
    window_id: Some(WindowId::new("main-window")),
    timestamp: AppEvent::now(),
};

emitter.emit(&event)?;
```

### 前端监听自定义事件

```typescript
useAppEvent('code:indexed', (payload) => {
  console.log('Code indexed:', payload);
});
```

## 测试

### 运行 Rust 测试

```bash
cargo test --lib app_events
cargo test --lib app_event_emitter
```

### 运行使用示例

```bash
cargo run --example event_usage
```

## 最佳实践

1. **使用专门的 Hooks**：优先使用 `useThemeEvent`、`useServiceStatus` 等专门的 Hooks
2. **避免过度监听**：只监听必要的事件，使用 `useFilteredEvent` 过滤不需要的事件
3. **清理监听器**：Hooks 会自动清理，手动监听时确保调用 `unlisten()`
4. **错误处理**：在事件处理函数中添加错误处理逻辑
5. **性能优化**：对于高频事件（如 `window:moved`），考虑使用防抖或节流
6. **类型安全**：始终使用 TypeScript 类型来确保类型安全

## 调试

### 启用日志

```rust
// Rust 后端
log::debug!("Event emitted: {}", event.event_name());
```

```typescript
// 前端
useAppEvent('*', (payload) => {
  console.log('Event received:', payload);
});
```

### 查看事件流

在浏览器开发工具中：

```typescript
import { listen } from '@tauri-apps/api/event';

// 监听所有事件
const unlisten = await listen('*', (event) => {
  console.log('Event:', event.event, event.payload);
});
```

## 文件结构

```
src/
├── app_events.rs              # 事件定义（Rust）
├── app_event_emitter.rs       # 事件发射器（Rust）
└── ...

packages/open-web/src/
├── types/
│   └── app-events.types.ts   # TypeScript 类型定义
├── hooks/
│   └── use-app-events.ts     # React Hooks
└── components/
    └── event-demo.tsx        # 使用示例组件

examples/
└── event_usage.rs            # Rust 使用示例
```

## 贡献指南

添加新事件类型时：

1. 在 `app_events.rs` 中添加新的枚举变体
2. 更新 `event_name()` 方法
3. 在 `app-events.types.ts` 中添加对应的 TypeScript 类型
4. 如需要，在 `use-app-events.ts` 中添加专门的 Hook
5. 更新本文档
6. 添加测试用例

## 许可证

本项目遵循 MIT 许可证。
