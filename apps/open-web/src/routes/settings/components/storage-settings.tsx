import { useSettingsStore } from '../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { SettingsItem } from './settings-item';

const StorageSettings = () => {
  const { config, setConfig } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">数据存储设置</h2>

      <SettingsSection title="存储路径配置">
        <div>
          <label className="mb-2 block text-sm font-medium">本地存储路径</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.storage.localPath}
            onChange={(e) => setConfig({ storage: { ...config.storage, localPath: e.target.value } })}
            placeholder="留空使用默认路径"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">备份路径</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.storage.backupPath}
            onChange={(e) => setConfig({ storage: { ...config.storage, backupPath: e.target.value } })}
            placeholder="留空使用默认路径"
          />
        </div>
      </SettingsSection>

      <SettingsSection title="缓存与备份">
        <div>
          <label className="mb-2 block text-sm font-medium">最大缓存大小</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={config.storage.maxCacheSize}
              onChange={(e) =>
                setConfig({ storage: { ...config.storage, maxCacheSize: Number.parseInt(e.target.value) } })
              }
              className="flex-1"
            />
            <span className="text-sm font-medium text-gray-700">{config.storage.maxCacheSize} MB</span>
          </div>
        </div>

        <SettingsItem label="自动清理" description="定期自动清理过期缓存">
          <input
            type="checkbox"
            checked={config.storage.autoCleanup}
            onChange={(e) => setConfig({ storage: { ...config.storage, autoCleanup: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="启用备份" description="定期自动备份工作空间数据">
          <input
            type="checkbox"
            checked={config.storage.backupEnabled}
            onChange={(e) => setConfig({ storage: { ...config.storage, backupEnabled: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>
      </SettingsSection>
    </div>
  );
};

export { StorageSettings };
