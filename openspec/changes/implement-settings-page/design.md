# 架构设计

## 整体架构

设置页面采用经典的主从布局（Master-Detail Layout）：

```
┌─────────────────────────────────────────────────┐
│  Header: 设置标题                │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  侧边栏   │  内容区域                             │
│  菜单     │  (根据选中的菜单项渲染对应设置组件)    │
│          │                                      │
│ • 通用    │  [设置表单]                           │
│ • 外观    │  - 输入控件                           │
│ • 存储    │  - 选择框                             │
│ • 云存储  │  - 开关                               │
│ • AI提供商│  - 按钮                               │
│ • 服务器  │                                      │
│ • 快捷键  │  [操作按钮: 保存 / 重置]              │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

## 组件层次

```
SettingsPage (index.tsx)
└── SettingsLayout
    ├── SettingsMenu (左侧菜单)
    │   └── MenuItem × 7
    └── SettingsContent (右侧内容)
        ├── GeneralSettings
        ├── AppearanceSettings
        ├── StorageSettings
        ├── CloudSettings
        ├── AIProviderSettings
        ├── ServerSettings
        └── ShortcutsSettings
```

## 数据流

### 状态管理

使用 Zustand 集中管理设置状态：

```typescript
// settings-store.ts
interface SettingsStore {
  config: AppConfig; // 完整配置对象
  setConfig: (partial) => void; // 部分更新
  resetConfig: () => void; // 重置为默认
  exportConfig: () => string; // 导出 JSON
  importConfig: (json) => void; // 导入 JSON
}
```

### 持久化策略

```typescript
// 使用 Zustand persist 中间件
persist(storeCreator, {
  name: 'open-context-settings',
  version: 1,
  migrate: (persistedState, version) => {
    // 处理配置版本升级
    if (version === 0) {
      return migrateV0ToV1(persistedState);
    }
    return persistedState;
  },
  partialize: (state) => ({
    config: {
      ...state.config,
      _internal: undefined // 不持久化内部状态
    }
  })
});
```

### 敏感信息处理

对于 API Key、Secret Key 等敏感信息：

1. **存储层**：使用 Tauri 的 Store 插件存储加密后的值
2. **传输层**：组件与 Store 之间传输明文（仅内存中）
3. **展示层**：使用密码输入框（type="password"）或自定义遮罩组件

```typescript
// 伪代码示例
const useSecureStorage = (key: string) => {
  const [value, setValue] = useState('');

  useEffect(() => {
    tauriStore.get(key).then((encrypted) => {
      const decrypted = decrypt(encrypted);
      setValue(decrypted);
    });
  }, [key]);

  const save = (newValue: string) => {
    const encrypted = encrypt(newValue);
    tauriStore.set(key, encrypted);
    setValue(newValue);
  };

  return [value, save];
};
```

## 组件设计

### 通用表单控件

创建可复用的设置表单控件：

```typescript
// SettingsItem: 统一的设置项容器
interface SettingsItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

// SettingsSection: 设置分组
interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// KeyboardInput: 快捷键输入组件
interface KeyboardInputProps {
  value: string; // 如 "Ctrl+S"
  onChange: (value: string) => void;
  onConflict?: (conflictActions: string[]) => void;
}
```

### 快捷键设置特殊设计

快捷键设置是最复杂的功能，需要特殊设计：

#### 数据结构

```typescript
interface ShortcutConfig {
  action: string; // 如 'editor.save'
  label: string; // 如 '保存文件'
  category: string; // 如 'editor' | 'workspace' | 'global'
  keys: string; // 如 'Ctrl+S'
  defaultKeys: string; // 默认快捷键
}

type ShortcutsMap = Record<string, ShortcutConfig>;
```

#### 冲突检测

```typescript
const detectConflicts = (shortcuts: ShortcutsMap, action: string, newKeys: string): string[] => {
  const conflicts: string[] = [];
  for (const [key, config] of Object.entries(shortcuts)) {
    if (key !== action && config.keys === newKeys) {
      conflicts.push(config.label);
    }
  }
  return conflicts;
};
```

#### UI 交互流程

1. 用户点击快捷键输入框
2. 输入框进入"监听模式"（提示"按下快捷键..."）
3. 用户按下组合键（如 Ctrl+S）
4. 系统检测冲突
5. 如果有冲突，显示警告对话框，让用户选择：
   - 覆盖现有快捷键
   - 取消修改
6. 保存快捷键配置

## AI 提供商设置设计

支持多个 AI 提供商，每个提供商有独立的配置：

```typescript
interface AIProviderConfig {
  id: string; // 唯一标识
  name: string; // 显示名称（OpenAI、Claude、Azure OpenAI、智谱AI）
  type: 'openai-compatible' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string; // 自定义 API 地址
  models: string[]; // 可用模型列表
  defaultModel?: string; // 默认模型
  enabled: boolean;
}

interface AIConfig {
  providers: AIProviderConfig[];
  defaultProvider: string; // 默认使用的提供商 ID
  modelParams: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}
```

### UI 设计

- 提供商列表：使用卡片展示，每个卡片包含：
  - 提供商名称和图标
  - 启用/禁用开关
  - 编辑按钮
  - 删除按钮
- 添加提供商：模态对话框，选择类型后填写配置
- 测试连接：提供"测试连接"按钮验证 API Key 和配置

## 云存储设置设计

### COS 配置

```typescript
interface COSConfig {
  secretId: string;
  secretKey: string;
  region: string; // 如 'ap-guangzhou'
  bucket: string; // 如 'my-bucket-1250000000'
  pathPrefix?: string; // 存储路径前缀
}

interface CloudStorageConfig {
  enabled: boolean;
  provider: 'cos' | 's3' | 'oss';
  cosConfig: COSConfig;
  syncStrategy: 'auto' | 'manual' | 'wifi-only';
  autoSyncInterval?: number; // 自动同步间隔（分钟）
  excludePatterns: string[]; // 排除同步的文件模式
}
```

### UI 功能

- 配置表单：SecretId、SecretKey、Region、Bucket
- 区域选择：下拉菜单，列出腾讯云所有区域
- 测试连接：验证配置是否正确
- 存储空间信息：显示已使用空间和总空间（需要 API 支持）
- 同步状态：显示最后同步时间、同步文件数

## 技术选型

### UI 组件库

- **基础组件**：shadcn/ui（已集成）
- **表单管理**：React Hook Form + Zod（可选，后续优化）
- **图标**：lucide-react（已使用）

### 状态管理

- **全局状态**：Zustand（已使用）
- **持久化**：zustand/middleware/persist
- **敏感信息**：Tauri Store（加密存储）

### 类型安全

- **编译时**：TypeScript 完整类型定义
- **运行时**：Zod schema 验证（可选）

## 性能优化

1. **延迟加载**：使用 React.lazy 延迟加载各设置页面组件
2. **防抖保存**：设置变更后 500ms 内无新变更才保存
3. **虚拟滚动**：快捷键列表较长时使用虚拟滚动
4. **条件渲染**：只渲染当前激活的设置页面

## 国际化

所有设置项的标签和描述都需要国际化：

```typescript
// i18n/locales/zh-CN/settings.json
{
  "general": {
    "title": "通用设置",
    "language": {
      "label": "语言",
      "description": "选择应用界面语言"
    },
    "autoUpdate": {
      "label": "自动更新",
      "description": "自动检查并安装应用更新"
    }
  },
  // ... 其他设置项
}
```

使用方式：

```typescript
const { t } = useTranslation('settings');
<SettingsItem
  label={t('general.language.label')}
  description={t('general.language.description')}
>
  <Select />
</SettingsItem>
```

## 错误处理

1. **表单验证**：输入值不合法时显示错误提示
2. **保存失败**：显示 Toast 提示保存失败原因
3. **API 测试失败**：显示详细的错误信息（如网络错误、认证失败）
4. **导入配置失败**：JSON 格式错误或版本不兼容时提示用户

## 可访问性

- 所有表单控件都有 label
- 使用语义化 HTML 标签
- 支持键盘导航（Tab 切换、Enter 确认）
- 快捷键输入框支持 Escape 取消
