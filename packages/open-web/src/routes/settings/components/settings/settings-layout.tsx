import { X, Settings, Palette, Database, Cloud, BrainCircuit, Server, Key } from 'lucide-react';
import { useSettingsStore } from '../../../../storage/settings-store';
import { GeneralSettings } from './general-settings';
import { AppearanceSettings } from './appearance-settings';
import { StorageSettings } from './storage-settings';
import { ServerSettings } from './server-settings';
import { CloudSettings } from './cloud-settings';
import { AIProviderSettings } from './ai-provider-settings';
import { ShortcutsSettings } from './shortcuts-settings';
import { Sidebar } from '../../../../components/layout/sidebar';
import { cn } from '../../../../lib/utils';

const SettingsLayout = () => {
  const { config } = useSettingsStore();

  const iconMap = {
    Settings,
    Palette,
    Database,
    Cloud,
    BrainCircuit,
    Server,
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
      id: 'storage',
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
      id: 'ai',
      label: 'AI 提供商',
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
      id: 'shortcuts',
      label: '快捷键',
      icon: 'Key',
      description: '键盘快捷键配置'
    }
  ];

  const activeItem = settingsMenuItems.find((item) => item.id === config._internal.activeCategory);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <aside className="w-56 shrink-0 border-r border-gray-200 bg-gray-50">
        <div className="flex h-16 items-center justify-center border-b border-gray-200">
          <span className="font-semibold text-gray-700">设置</span>
        </div>
        <SettingsMenu settingsMenuItems={settingsMenuItems} iconMap={iconMap} />
      </aside>

      <main className="flex-1 overflow-hidden bg-white">
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
        const isActive = config._internal.activeCategory === item.id;
        const IconComponent = iconMap[item.icon];
        return (
          <button
            key={item.id}
            onClick={() => setConfig({ _internal: { activeCategory: item.id as any } })}
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

const SettingsContent = () => {
  const { config } = useSettingsStore();

  const renderContent = () => {
    switch (config._internal.activeCategory) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'storage':
        return <StorageSettings />;
      case 'cloud':
        return <CloudSettings />;
      case 'ai':
        return <AIProviderSettings />;
      case 'server':
        return <ServerSettings />;
      case 'shortcuts':
        return <ShortcutsSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return <div className="max-w-3xl">{renderContent()}</div>;
};

export { SettingsLayout };
