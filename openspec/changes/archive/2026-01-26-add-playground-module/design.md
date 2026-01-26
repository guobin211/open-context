## 上下文

Open-Context 需要一个开发测试环境来快速验证各种编辑器和查看器组件。当前缺少统一的组件展示平台，开发者需要在实际功能中集成组件才能测试，增加了开发成本和风险。

**约束**：

- 必须支持代码分割和懒加载，避免包体积膨胀
- 必须适配现有的暗色模式和国际化系统
- 必须复用现有组件（Tiptap 编辑器、文件树）
- 必须遵循现有路由和组件架构规范

**利益相关者**：前端开发团队、UI/UX 设计团队

## 目标 / 非目标

### 目标

- 提供 16 个独立的编辑器/查看器/工具组件页面
- 实现统一的 Playground 布局和导航系统
- 确保所有组件支持暗色模式和国际化
- 优化加载性能，确保 Lighthouse 评分 > 90

### 非目标

- 不实现组件的持久化存储功能
- 不集成到主应用的核心业务流程
- 不提供组件的生产级配置选项
- 不实现组件间的数据共享机制

## 决策

### 技术选型

**代码编辑器：选择 Monaco Editor**

- ✅ VS Code 同源，功能完整
- ✅ 支持 50+ 编程语言
- ✅ 内置 TypeScript 智能提示
- ❌ 包体积较大（~2 MB gzipped）

**考虑的替代方案**：

- CodeMirror 6：包体积更小（~500 KB），但功能不如 Monaco 完整
- Ace Editor：成熟但社区活跃度下降

**终端：选择 xterm.js**

- ✅ 完整的终端模拟器
- ✅ 支持 ANSI 颜色和控制序列
- ✅ VS Code 同样使用此库
- ❌ 需要额外的 addon（fit、weblinks）

**考虑的替代方案**：

- react-terminal：功能简单，不支持复杂场景

**文件管理器：选择 react-window + 自定义网格**

- ✅ 虚拟滚动，支持大量文件
- ✅ 灵活的自定义布局
- ✅ 轻量级（~5 KB）

**考虑的替代方案**：

- react-virtualized：功能强大但包体积大（150 KB）
- tanstack-virtual：现代化但生态较新

**数据可视化：选择 AntV G2 + X6**

- ✅ 国内团队维护，文档完善
- ✅ G2 支持 60+ 图表类型
- ✅ X6 专注于流程图和关系图
- ❌ 包体积较大（~1.5 MB gzipped）

**考虑的替代方案**：

- ECharts：功能强大但 API 较复杂
- D3.js：灵活但学习曲线陡峭

**工作流编辑器：选择 React Flow**

- ✅ 专为 React 设计，API 简洁
- ✅ 支持自定义节点和边
- ✅ 内置缩放、平移、对齐功能
- ✅ 活跃维护（每周更新）

**考虑的替代方案**：

- xyflow：React Flow 的旧版本，已废弃
- jsplumb：基于 jQuery，不适合 React

### 路由架构

**采用 TanStack Router 文件系统路由**

- 每个子页面独立路由文件（`routes/playground/*.tsx`）
- 自动生成 `routeTree.gen.ts`
- 支持路由级代码分割

### 布局架构

**左右分栏布局 `PlaygroundLayout`**

```tsx
<PlaygroundLayout>
  <PlaygroundSidebar>{/* 导航列表，支持 Y 轴滚动 */}</PlaygroundSidebar>
  <PlaygroundContent>
    <PlaygroundHeader title="Markdown 编辑器" />
    <PlaygroundMain>{/* 组件实现 */}</PlaygroundMain>
    <PlaygroundToolbar>{/* 工具栏（可选）*/}</PlaygroundToolbar>
  </PlaygroundContent>
</PlaygroundLayout>
```

**设计原则**：

- 左侧边栏：固定宽度 240px，支持 Y 轴滚动
- 右侧内容区：flex-1 自适应宽度，支持 Y 轴滚动
- 内容区顶部：48px 固定标题栏
- 内容区主体：自适应高度，各组件独立滚动策略
- 内容区底部：40px 工具栏（可选）

### 性能优化策略

**代码分割方案**：

```typescript
// 每个编辑器独立 chunk
const MonacoEditor = lazy(() => import('@/components/playground/code-editor/monaco-editor'));
const XtermTerminal = lazy(() => import('@/components/playground/terminal/xterm-terminal'));
```

**Vite 配置**：

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'monaco': ['@monaco-editor/react'],
        'xterm': ['@xterm/xterm', '@xterm/addon-fit'],
        'antv': ['@antv/g2', '@antv/x6'],
        'react-flow': ['@xyflow/react']
      }
    }
  }
}
```

## 风险 / 权衡

### 风险 1：包体积膨胀

- **影响**：初始加载时间增加，用户体验下降
- **缓解措施**：
  - 所有编辑器组件使用 React.lazy 懒加载
  - Vite manualChunks 配置，将大型库独立打包
  - 使用 CDN 加载 Monaco Editor 和 PDF.js（可选）
  - 生产环境启用 gzip/brotli 压缩

### 风险 2：浏览器兼容性

- **影响**：部分库（tree-sitter-wasm）需要 WebAssembly 支持
- **缓解措施**：
  - 添加浏览器检测和降级提示
  - 提供非 WASM 的备用方案（纯 JS 解析器）
  - 文档明确标注浏览器要求（Chrome 90+, Safari 15+）

### 风险 3：性能问题

- **影响**：多个重量级编辑器可能导致内存占用过高
- **缓解措施**：
  - 限制同时打开的标签页数量（最多 10 个）
  - 组件卸载时主动释放资源（Monaco 实例销毁）
  - 使用 React Profiler 监控性能瓶颈

### 风险 4：Tauri API 限制

- **影响**：Webview 浏览器功能受 Tauri 权限限制
- **缓解措施**：
  - 使用 Tauri 提供的 WebviewWindow API
  - 添加权限配置说明文档
  - 提供 iframe 作为备选方案

## 权衡分析

| 决策                   | 优势                   | 劣势                 | 结论                      |
| ---------------------- | ---------------------- | -------------------- | ------------------------- |
| 使用 Monaco Editor     | 功能完整，VS Code 同源 | 包体积大（2 MB）     | ✅ 接受，通过代码分割缓解 |
| 16 个子页面全实现      | 功能全面，展示丰富     | 开发周期长（6-8 天） | ✅ 接受，分阶段实施       |
| 复用现有组件           | 减少开发时间           | 功能可能不够丰富     | ✅ 接受，优先级更高       |
| 使用 AntV 而非 ECharts | 文档友好，API 简洁     | 社区略小             | ✅ 接受，适合项目需求     |

## 迁移计划

**无需迁移**：此为新增功能，不影响现有代码。

**回滚计划**：

1. 删除 `routes/playground/` 目录
2. 删除 `components/playground/` 目录
3. 卸载新增依赖包
4. 清理 Vite 配置中的 manualChunks

## 待决问题

1. **是否需要组件代码导出功能？**
   - 用户可能希望复制组件代码到自己的项目
   - 需要确认是否值得投入开发时间

2. **是否集成 Storybook？**
   - Storybook 提供更专业的组件文档和测试环境
   - 但增加了构建复杂度和依赖包

3. **Monaco Editor 是否使用 CDN？**
   - CDN 可减少构建产物大小
   - 但增加了外部依赖和网络延迟风险
   - **建议**：本地打包，通过代码分割优化

4. **是否支持组件间的数据共享？**
   - 例如代码编辑器的内容可传递给 AST 查看器
   - 增加了状态管理复杂度
   - **建议**：首版不实现，后续按需添加

## 参考资料

- [Monaco Editor API](https://microsoft.github.io/monaco-editor/docs.html)
- [xterm.js 文档](https://xtermjs.org/)
- [React Flow 文档](https://reactflow.dev/)
- [AntV G2 文档](https://g2.antv.antgroup.com/)
- [AntV X6 文档](https://x6.antv.antgroup.com/)
- [TanStack Router 文档](https://tanstack.com/router)
- [Vite 代码分割指南](https://vitejs.dev/guide/build.html#chunking-strategy)
