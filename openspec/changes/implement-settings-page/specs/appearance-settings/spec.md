# 功能规范：外观设置

## 概述

外观设置页面允许用户自定义应用的视觉样式，包括主题模式、字体大小、编辑器主题和界面缩放。

## 新增需求

### 需求：用户可以选择应用主题模式

应用**必须**提供主题模式选择功能，用户**必须**能够在浅色、深色和跟随系统三种主题模式之间切换。

#### 场景：用户切换到深色主题

**前置条件**：

- 用户已打开设置页面
- 当前在"外观设置"标签页
- 当前主题为"浅色"或"跟随系统"

**操作步骤**：

1. 用户在"主题模式"选项中选择"深色"
2. 界面立即应用深色主题

**预期结果**：

- 应用背景变为深色（#1a1a1a）
- 文本颜色变为浅色（#ffffff）
- 所有组件按照深色主题样式渲染
- 设置自动保存

**边界情况**：

- 某些第三方组件可能不支持深色主题，需要自定义样式

#### 场景：用户选择"跟随系统"

**前置条件**：

- 用户已打开设置页面
- 当前主题为"浅色"或"深色"

**操作步骤**：

1. 用户在"主题模式"选项中选择"跟随系统"

**预期结果**：

- 应用主题跟随操作系统当前设置
- 当系统切换明暗模式时，应用自动切换主题
- 使用 `window.matchMedia('(prefers-color-scheme: dark)')` 监听系统变化

---

### 需求：用户可以调节字体大小

应用**必须**提供字体大小调节功能，用户**必须**能够在 12px 到 24px 范围内调节应用界面的字体大小。

#### 场景：用户增大字体

**前置条件**：

- 用户已打开设置页面
- 当前字体大小为 14px（默认）

**操作步骤**：

1. 用户拖动"字体大小"滑块向右
2. 或者在数字输入框输入 18
3. 界面字体实时变大

**预期结果**：

- 应用根字体大小设置为 18px
- 所有使用相对单位（rem）的文本随之放大
- 字体大小范围：12px - 24px

**边界情况**：

- 字体过大时，某些组件可能出现布局问题（需要测试）
- 输入超出范围的值时，自动限制在有效范围内

---

### 需求：用户可以选择编辑器主题

应用**必须**提供编辑器主题选择功能，用户**必须**能够为代码编辑器和 Markdown 编辑器选择不同的颜色主题。

#### 场景：用户切换编辑器主题

**前置条件**：

- 用户已打开设置页面
- 当前编辑器主题为"vs-light"（默认）

**操作步骤**：

1. 用户在"编辑器主题"下拉菜单中选择"Monokai"
2. 切换到笔记或代码编辑器查看效果

**预期结果**：

- Monaco Editor 应用 Monokai 配色方案
- Tiptap 代码块应用对应的语法高亮主题

**可选主题列表**：

- VS Light（浅色，默认）
- VS Dark（深色）
- Monokai（深色，流行）
- Solarized Light（浅色，护眼）
- Solarized Dark（深色，护眼）
- GitHub Light（浅色）
- GitHub Dark（深色）
- Dracula（深色，流行）

---

### 需求：用户可以调节界面缩放

应用**必须**提供界面缩放功能，用户**必须**能够在 80% 到 150% 范围内整体放大或缩小应用界面。

#### 场景：用户放大界面

**前置条件**：

- 用户已打开设置页面
- 当前界面缩放为 100%（默认）

**操作步骤**：

1. 用户拖动"界面缩放"滑块向右到 125%
2. 或者在下拉菜单选择"125%"

**预期结果**：

- 整个应用界面按比例放大 1.25 倍
- 使用 CSS `zoom` 或 `transform: scale()` 实现
- 缩放范围：80% - 150%

**边界情况**：

- 缩放过大时，部分内容可能超出窗口（需要滚动）
- 缩放过小时，文本可能难以阅读

---

## UI 布局

```
┌─────────────────────────────────────────────────┐
│  外观设置                                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  主题模式                                        │
│  ○ 浅色  ● 深色  ○ 跟随系统                      │
│  选择应用的颜色主题                               │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  字体大小                                        │
│  ├─────●─────────────────────┤  14 px          │
│  12                          24                 │
│  调节应用界面的字体大小                           │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  编辑器主题                                      │
│  ┌────────────────────────────────────────┐    │
│  │ VS Light                        ▼       │    │
│  └────────────────────────────────────────┘    │
│  选择代码编辑器的颜色主题                         │
│                                                 │
│  ─────────────────────────────────────────      │
│                                                 │
│  界面缩放                                        │
│  ├─────────●─────────────────┤  100 %          │
│  80                          150                │
│  调节整个应用界面的显示比例                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 技术实现

### 类型定义

```typescript
interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  fontSize: number; // 12-24
  editorTheme:
    | 'vs-light'
    | 'vs-dark'
    | 'monokai'
    | 'solarized-light'
    | 'solarized-dark'
    | 'github-light'
    | 'github-dark'
    | 'dracula';
  uiScale: number; // 0.8-1.5
}
```

### 主题切换实现

```typescript
// 使用 CSS 变量 + data-theme 属性
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
  let effectiveTheme = theme;
  if (theme === 'system') {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    effectiveTheme = isDark ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effectiveTheme);
};

// 监听系统主题变化
useEffect(() => {
  if (config.appearance.theme === 'system') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
}, [config.appearance.theme]);
```

### 字体大小实现

```typescript
// 设置根元素字体大小
const applyFontSize = (fontSize: number) => {
  document.documentElement.style.fontSize = `${fontSize}px`;
};
```

### 界面缩放实现

```typescript
// 使用 CSS zoom（注意浏览器兼容性）
const applyUIScale = (scale: number) => {
  document.body.style.zoom = `${scale}`;
};
```

## 数据验证

- 主题必须是 `'light' | 'dark' | 'system'`
- 字体大小必须在 12-24 之间
- 编辑器主题必须是预定义的值
- UI 缩放必须在 0.8-1.5 之间

## 国际化

```json
{
  "settings": {
    "appearance": {
      "title": "外观设置",
      "theme": {
        "label": "主题模式",
        "light": "浅色",
        "dark": "深色",
        "system": "跟随系统"
      },
      "fontSize": {
        "label": "字体大小",
        "description": "调节应用界面的字体大小"
      },
      "editorTheme": {
        "label": "编辑器主题",
        "description": "选择代码编辑器的颜色主题"
      },
      "uiScale": {
        "label": "界面缩放",
        "description": "调节整个应用界面的显示比例"
      }
    }
  }
}
```

## 相关功能

- **通用设置**：语言选择会影响主题中的文本显示
- **编辑器组件**：编辑器主题设置直接影响 Monaco Editor 和 Tiptap 的样式
