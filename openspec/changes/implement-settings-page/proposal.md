# 提案：实现完整的设置页面功能

## 概述

本提案旨在为 Open-Context 的前端（open-web）实现一个功能完整的设置页面，提供用户可配置的应用参数，包括语言、主题、文件存储、云存储、AI 提供商、服务器配置、快捷键等核心设置项。

## 背景

当前 `packages/open-web/src/routes/settings/` 目录下已有基础设置页面框架：

- 设置页面路由（settings/index.tsx）仅显示占位内容
- settings-layout.tsx 已实现设置菜单框架（8 个菜单项）
- general-settings.tsx 仅实现语言选择功能
- settings-store.ts 定义了 AppConfig 接口和默认配置
- 其他 7 个设置分类（外观、数据存储、云存储、模型、服务器、服务开关、鉴权）均为占位组件

用户需要一个功能完整的设置界面来配置应用行为，参考 Cherry Studio 等成熟工具的设置项设计。

## 目标

1. **完善通用设置**：语言、主题、启动行为、自动更新
2. **实现外观设置**：主题模式、字体大小、编辑器主题、界面缩放
3. **实现数据存储设置**：本地存储路径配置、数据导入导出、缓存管理
4. **实现云存储设置**：腾讯云 COS 配置、同步策略、存储空间管理
5. **实现 AI 提供商设置**：本地/云端模型选择、API 密钥管理、模型参数配置
6. **实现服务器设置**：Open-Node 服务配置、端口设置、自动启动
7. **实现快捷键设置**：可视化快捷键编辑器、快捷键冲突检测、预设方案

## 不包含的内容

- 不实现后端 API（COS 上传、模型调用等业务逻辑由其他变更处理）
- 不实现快捷键的全局注册逻辑（仅实现配置界面）
- 不实现主题的实际切换逻辑（仅实现配置界面，切换逻辑由主题系统处理）
- 不修改 Tauri 命令或 Rust 后端代码

## 实现方案

### 架构设计

采用以下分层结构：

```
packages/open-web/src/
├── routes/settings/
│   ├── index.tsx                    # 设置页面入口（使用 SettingsLayout）
│   └── components/settings/
│       ├── settings-layout.tsx      # 布局组件（已存在，需微调）
│       ├── settings-menu.tsx        # 菜单组件（从 layout 中抽取）
│       ├── general-settings.tsx     # 通用设置（扩展现有）
│       ├── appearance-settings.tsx  # 外观设置（新增）
│       ├── storage-settings.tsx     # 数据存储设置（新增）
│       ├── cloud-settings.tsx       # 云存储设置（新增）
│       ├── ai-provider-settings.tsx # AI 提供商设置（新增）
│       ├── server-settings.tsx      # 服务器设置（新增）
│       └── shortcuts-settings.tsx   # 快捷键设置（新增）
├── storage/
│   └── settings-store.ts            # 设置状态管理（扩展现有）
└── lib/
    ├── app-settings.ts              # 设置类型定义（扩展现有）
    └── default-shortcuts.ts         # 默认快捷键配置（新增）
```

### 数据模型设计

扩展 `AppConfig` 接口：

```typescript
export interface AppConfig {
  // 通用设置
  general: {
    language: 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';
    autoUpdate: boolean;
    startOnBoot: boolean;
    minimizeToTray: boolean;
  };

  // 外观设置
  appearance: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number; // 12-24
    editorTheme: 'vs-light' | 'vs-dark' | 'hc-black';
    uiScale: number; // 0.8-1.5
  };

  // 数据存储
  storage: {
    localPath: string;
    maxCacheSize: number; // MB
    autoCleanup: boolean;
    backupEnabled: boolean;
    backupPath: string;
  };

  // 云存储
  cloudStorage: {
    enabled: boolean;
    provider: 'cos' | 's3' | 'oss'; // 扩展性
    cosConfig: {
      secretId: string;
      secretKey: string;
      region: string;
      bucket: string;
    };
    syncStrategy: 'auto' | 'manual' | 'wifi-only';
  };

  // AI 提供商
  aiProvider: {
    type: 'local' | 'cloud';
    localModel: string;
    cloudProviders: Array<{
      name: string; // 'openai' | 'anthropic' | 'azure' | 'zhipu'
      apiKey: string;
      baseUrl?: string;
      models: string[];
    }>;
    defaultProvider: string;
    modelParams: {
      temperature: number;
      maxTokens: number;
      topP: number;
    };
  };

  // 服务器
  server: {
    nodeServerEnabled: boolean;
    nodeServerUrl: string;
    nodeServerPort: number;
    autoStartServer: boolean;
    mcpEnabled: boolean;
    httpApiEnabled: boolean;
  };

  // 快捷键
  shortcuts: Record<string, string>; // action -> key combination

  // 内部状态
  _internal: {
    activeCategory: SettingsCategory;
  };
}
```

### UI 组件设计

每个设置页面遵循统一的布局模式：

1. **表单区域**：使用 shadcn/ui 的 Form 组件
2. **分组**：使用卡片或分隔线区分不同设置组
3. **输入控件**：
   - 文本输入：Input
   - 下拉选择：Select
   - 开关：Switch
   - 数字输入：NumberInput（带滑块）
   - 快捷键输入：自定义 KeyboardInput 组件
4. **操作按钮**：保存、重置、导入、导出

### 状态持久化

- 使用 Zustand + persist 中间件
- 存储键：`open-context-settings`
- 在设置变更时立即保存（debounce 500ms）
- 提供重置到默认值功能

## 风险和注意事项

1. **类型安全**：
   - 所有配置项必须有完整的 TypeScript 类型定义
   - 使用 Zod 进行运行时校验（可选，后续优化）

2. **数据迁移**：
   - 旧版本配置需要兼容性处理
   - 提供配置版本号和迁移函数

3. **敏感信息**：
   - API Key、Secret Key 等敏感信息需要加密存储
   - 界面上显示时使用 `***` 遮罩

4. **快捷键冲突**：
   - 检测并提示用户快捷键冲突
   - 提供快捷键重置功能

5. **性能考虑**：
   - 设置项较多时避免一次性加载所有组件
   - 使用 React.lazy 延迟加载各设置页面

## 成功标准

1. 用户可以通过 UI 配置所有应用参数
2. 设置变更立即生效（或明确提示需要重启）
3. 所有表单输入都有验证和错误提示
4. 敏感信息（API Key）被安全处理
5. 支持导入/导出配置文件
6. 代码通过 TypeScript 类型检查和 ESLint 检查
7. 遵循项目的命名和代码风格约定

## 依赖关系

- 依赖 shadcn/ui 组件库（已安装）
- 依赖 Zustand 状态管理（已安装）
- 依赖 i18next 国际化（已安装）
- 无外部 API 依赖（配置仅存储在本地）

## 时间线

不包含具体时间估算，按以下顺序实施：

1. 扩展类型定义和状态管理
2. 实现通用设置和外观设置（基础功能）
3. 实现存储和服务器设置（中等复杂度）
4. 实现 AI 提供商和云存储设置（较复杂）
5. 实现快捷键设置（最复杂，独立功能）
6. 集成测试和 UI 优化
