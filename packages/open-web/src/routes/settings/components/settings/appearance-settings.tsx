import { useSettingsStore } from '../../../../storage/settings-store';
import { SettingsSection } from './settings-section';

const AppearanceSettings = () => {
  const { config, setConfig } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">外观设置</h2>

      <SettingsSection title="主题设置">
        <div>
          <label className="mb-2 block text-sm font-medium">主题模式</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.appearance.theme}
            onChange={(e) => setConfig({ appearance: { ...config.appearance, theme: e.target.value as any } })}
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="system">跟随系统</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">编辑器主题</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.appearance.editorTheme}
            onChange={(e) => setConfig({ appearance: { ...config.appearance, editorTheme: e.target.value as any } })}
          >
            <option value="vs-light">浅色</option>
            <option value="vs-dark">深色</option>
            <option value="hc-black">高对比度</option>
          </select>
        </div>
      </SettingsSection>

      <SettingsSection title="字体设置">
        <div>
          <label className="mb-2 block text-sm font-medium">字体大小</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="12"
              max="24"
              value={config.appearance.fontSize}
              onChange={(e) =>
                setConfig({ appearance: { ...config.appearance, fontSize: Number.parseInt(e.target.value) } })
              }
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700">{config.appearance.fontSize}px</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">界面缩放</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="80"
              max="150"
              step="10"
              value={config.appearance.uiScale * 100}
              onChange={(e) =>
                setConfig({ appearance: { ...config.appearance, uiScale: Number.parseInt(e.target.value) / 100 } })
              }
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700">{Math.round(config.appearance.uiScale * 100)}%</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export { AppearanceSettings };
