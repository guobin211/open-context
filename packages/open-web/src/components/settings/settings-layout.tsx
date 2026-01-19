import { X, Settings, Palette, Database, Cloud, BrainCircuit, Server, ToggleLeft, Key } from 'lucide-react';
import { useSettingsStore } from '../../zustand/settings-store';
import { GeneralSettings } from './general-settings';
import { cn } from '../../lib/utils';

const SettingsLayout = () => {
  const { config } = useSettingsStore();

  const iconMap = {
    Settings,
    Palette,
    Database,
    Cloud,
    BrainCircuit,
    Server,
    ToggleLeft,
    Key
  };

  const settingsMenuItems: Array<{
    id: string;
    label: string;
    icon: keyof typeof iconMap;
    description?: string;
  }> = [
    {
      id: 'general',
      label: '通用设置',
      icon: 'Settings',
      description: '语言、主题等基本设置'
    },
    {
      id: 'appearance',
      label: '外观设置',
      icon: 'Palette',
      description: '主题、配色方案'
    },
    {
      id: 'data',
      label: '数据存储',
      icon: 'Database',
      description: '本地数据存储路径'
    },
    {
      id: 'cloud',
      label: '云端存储',
      icon: 'Cloud',
      description: 'COS 云存储配置'
    },
    {
      id: 'models',
      label: '模型设置',
      icon: 'BrainCircuit',
      description: '本地和云端模型配置'
    },
    {
      id: 'server',
      label: '服务器设置',
      icon: 'Server',
      description: 'Open-Node 服务配置'
    },
    {
      id: 'services',
      label: '服务开关',
      icon: 'ToggleLeft',
      description: 'MCP 和 HTTP 服务开关'
    },
    {
      id: 'auth',
      label: '鉴权设置',
      icon: 'Key',
      description: 'API 密钥管理'
    }
  ];

  const activeItem = settingsMenuItems.find((item) => item.id === config.activeCategory);

  return (
    <div className="flex h-screen bg-white">
      <div className="flex w-full">
        <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50">
          <div className="flex h-16 items-center justify-center border-b border-gray-200">
            <span className="font-semibold text-gray-700">设置</span>
          </div>
          <SettingsMenu settingsMenuItems={settingsMenuItems} iconMap={iconMap} />
        </aside>

        <main className="flex-1 overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
            <h1 className="text-xl font-semibold text-gray-900">{activeItem?.label}</h1>
            <button
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              onClick={() => window.history.back()}
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="h-[calc(100vh-4rem)] overflow-auto p-6">
            <SettingsContent />
          </div>
        </main>
      </div>
    </div>
  );
};

const SettingsMenu = ({
  settingsMenuItems,
  iconMap
}: {
  settingsMenuItems: Array<{ id: string; label: string; icon: keyof typeof iconMap; description?: string }>;
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
}) => {
  const { config, setConfig } = useSettingsStore();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {settingsMenuItems.map((item) => {
        const isActive = config.activeCategory === item.id;
        const IconComponent = iconMap[item.icon];
        return (
          <button
            key={item.id}
            onClick={() => setConfig({ activeCategory: item.id })}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
              isActive ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <IconComponent className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

// 临时占位组件
const PlaceholderSettings = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h2 className="mb-4 text-lg font-semibold">{title}</h2>
    <p className="text-gray-500">此功能正在开发中...</p>
  </div>
);

const SettingsContent = () => {
  const { config } = useSettingsStore();

  const renderContent = () => {
    switch (config.activeCategory) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <PlaceholderSettings title="外观设置" />;
      case 'data':
        return <PlaceholderSettings title="数据存储" />;
      case 'cloud':
        return <PlaceholderSettings title="云端存储" />;
      case 'models':
        return <PlaceholderSettings title="模型设置" />;
      case 'server':
        return <PlaceholderSettings title="服务器设置" />;
      case 'services':
        return <PlaceholderSettings title="服务开关" />;
      case 'auth':
        return <PlaceholderSettings title="鉴权设置" />;
      default:
        return <GeneralSettings />;
    }
  };

  return <div className="max-w-3xl">{renderContent()}</div>;
};

export { SettingsLayout };
