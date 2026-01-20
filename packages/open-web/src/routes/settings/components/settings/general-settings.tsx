import { useSettingsStore } from '../../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { SettingsItem } from './settings-item';

const GeneralSettings = () => {
  const { config, setConfig } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">通用设置</h2>

      <SettingsSection title="基础设置">
        <div>
          <label className="mb-2 block text-sm font-medium">语言</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.general.language}
            onChange={(e) => setConfig({ general: { ...config.general, language: e.target.value as any } })}
          >
            <option value="zh-CN">简体中文</option>
            <option value="zh-TW">繁體中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <SettingsItem label="自动更新" description="启用后应用会自动检查并安装更新">
          <input
            type="checkbox"
            checked={config.general.autoUpdate}
            onChange={(e) => setConfig({ general: { ...config.general, autoUpdate: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="开机启动" description="启用后应用会在开机时自动启动">
          <input
            type="checkbox"
            checked={config.general.startOnBoot}
            onChange={(e) => setConfig({ general: { ...config.general, startOnBoot: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="最小化到托盘" description="关闭窗口时最小化到系统托盘">
          <input
            type="checkbox"
            checked={config.general.minimizeToTray}
            onChange={(e) => setConfig({ general: { ...config.general, minimizeToTray: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>
      </SettingsSection>
    </div>
  );
};

export { GeneralSettings };
