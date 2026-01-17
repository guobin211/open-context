# open-web

基于 Tauri 2.x 的桌面应用前端项目。

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
- **lodash.throttle** - 节流函数

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
