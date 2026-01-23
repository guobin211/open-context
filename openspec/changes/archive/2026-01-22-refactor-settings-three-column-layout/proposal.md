# 变更：重构设置页面为三栏布局

## 为什么

当前设置页面是独立的两栏布局（左侧设置菜单 + 右侧内容区），与应用主界面的侧边栏导航不一致。用户从主界面进入设置页面时，会丢失全局导航能力（如会话、笔记、文件、空间的快速切换）。

需要统一设置页面布局，使其融入主界面，提供连贯的用户体验。

## 变更内容

- 将设置页面重构为三栏布局：
  - 最左侧：复用主界面的通用 Sidebar 组件（包含会话、笔记、文件、空间导航）
  - 中间：设置页面专用的 SettingsMenu 组件（包含通用设置、外观设置、数据存储等 8 个设置分类）
  - 右侧：设置内容区域（根据选中的设置分类展示对应的配置界面）

- 移除当前 `settings-layout.tsx` 中的独立两栏布局
- 使用主界面的 `MainLayout` 组件作为外层容器
- 优化 `SettingsMenu` 组件，适配中间栏的视觉设计
- 确保设置页面与主界面的路由系统无缝集成

## 影响

- 受影响规范：settings（设置页面）
- 受影响代码：
  - `packages/open-web/src/routes/settings/index.tsx`（路由入口）
  - `packages/open-web/src/routes/settings/components/settings/settings-layout.tsx`（布局组件）
  - `packages/open-web/src/routes/settings/components/settings/settings-menu.tsx`（菜单组件）
  - `packages/open-web/src/components/layout/sidebar.tsx`（通用侧边栏）
  - `packages/open-web/src/components/layout/main-layout.tsx`（主布局）
