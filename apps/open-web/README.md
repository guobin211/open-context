# open-web

基于 Tauri 2.x 的桌面应用前端项目，提供用户界面和交互体验。

## 职责

- **UI 渲染** - React 组件和页面渲染
- **用户交互** - 表单处理、事件响应
- **状态管理** - Zustand（客户端）、React Query（服务端）
- **路由导航** - TanStack Router 类型安全路由
- **Tauri 通信** - 通过 Tauri API 调用 Rust 命令
- **服务调用** - HTTP 请求与 Node.js 后端通信

## 技术栈

### 核心框架

- **React 19** - 前端 UI 框架
- **TypeScript 5.8** - 类型安全
- **Vite 7** - 构建工具
- **Tauri 2** - 桌面应用框架

### 状态管理

- **Zustand** - 轻量级状态管理

### 路由

- **@tanstack/react-router** - 类型安全路由

### 数据请求

- **@tanstack/react-query** - 服务端状态管理与数据缓存

### 样式

- **Tailwind CSS 4** - 原子化 CSS 框架
- **Sass** - CSS 预处理器
- **tw-animate-css** - Tailwind 动画扩展

### UI 组件

- **Radix UI** - 无样式组件库
  - AlertDialog、Avatar、Checkbox、DropdownMenu、Popover、Separator 等
- **Lucide React** - 图标库
- **class-variance-authority** - 组件变体管理
- **clsx / tailwind-merge** - 类名合并工具

### 富文本编辑

- **Tiptap** - 基于 ProseMirror 的富文本编辑器框架

### 国际化

- **i18next** - 国际化框架
- **react-i18next** - React 绑定
- **i18next-browser-languagedetector** - 浏览器语言检测

### Tauri 插件

- **plugin-autostart** - 开机自启
- **plugin-clipboard-manager** - 剪贴板管理
- **plugin-dialog** - 系统对话框
- **plugin-fs / plugin-fs-pro** - 文件系统
- **plugin-global-shortcut** - 全局快捷键
- **plugin-log** - 日志
- **plugin-opener** - 打开文件/URL
- **plugin-os** - 系统信息
- **plugin-positioner** - 窗口定位
- **plugin-shell** - Shell 命令
- **plugin-store** - 持久化存储
- **plugin-updater** - 应用更新
- **plugin-window-state** - 窗口状态管理

### 工具库

- **@floating-ui/react** - 浮动 UI 定位
- **react-hotkeys-hook** - 快捷键绑定

## 目录结构

```
open-web/
├── src/
│   ├── components/        # React 组件
│   │   ├── ui/           # shadcn/ui 组件库
│   │   ├── tiptap-*/     # Tiptap 富文本编辑器
│   ├── routes/            # TanStack Router 路由
│   ├── storage/           # Zustand stores（客户端状态）
│   ├── services/          # 服务层（HTTP/Tauri）
│   ├── hooks/             # 自定义 React hooks
│   ├── context/           # Context Providers
│   ├── lib/               # 工具函数
│   ├── i18n/              # 国际化配置
│   │   └── locales/      # 语言文件 (zh-CN, en, ja, ko, zh-TW)
│   ├── app.tsx            # 应用入口
│   └── globals.scss      # 全局样式
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 核心功能

### 路由系统

- **TanStack Router** - 类型安全的文件系统路由
- **动态路由** - 支持参数和嵌套路由
- **加载状态** - 自动路由加载状态管理

### 状态管理

| 方案            | 用途             | 存储位置       |
| --------------- | ---------------- | -------------- |
| **Zustand**     | 客户端全局状态   | `src/storage/` |
| **React Query** | 服务端状态和缓存 | QueryProvider  |
| **useState**    | 组件局部状态     | 组件内         |

### 国际化

- 支持语言：zh-CN（简体中文）、en（英语）、ja（日语）、ko（韩语）、zh-TW（繁体中文）
- 自动语言检测和手动切换
- 命名空间翻译管理

### Tauri 集成

通过 Tauri API 调用 Rust 命令：

```typescript
import { invoke } from '@tauri-apps/api/core';

const workspaces = await invoke<Workspace[]>('get_all_workspaces');
```

### Node.js 服务通信

通过 HTTP 与后端服务通信：

```typescript
const response = await fetch('http://localhost:4500/api/v1/workspaces');
const data = await response.json();
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 预览构建产物
pnpm preview
```

## 代码规范

详见 [AGENTS.md](../../AGENTS.md) 中的 React 前端部分：

- **组件声明**：箭头函数 `export const Component = () =>`
- **导入规范**：绝对导入 `import { cn } from '@/lib/utils'`
- **命名规范**：PascalCase 组件、camelCase 函数、use- 前缀 Hooks
- **Props 接口**：`{组件名}Props`
- **类名合并**：使用 `cn()` 工具函数
- **样式优先**：Tailwind CSS 原子类 > SCSS 模块

## 相关文档

- **[AGENTS.md](../../AGENTS.md)** - 完整代码规范和架构模式
- **[共享存储规范](../../docs/SHARED_STORAGE.md)** - 数据存储路径规范

## License

MIT
