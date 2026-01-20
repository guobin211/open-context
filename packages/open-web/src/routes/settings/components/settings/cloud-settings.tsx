import { useSettingsStore } from '../../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { SettingsItem } from './settings-item';

const CloudSettings = () => {
  const { config, setConfig } = useSettingsStore();

  const maskSecret = (secret: string) => {
    if (!secret) return '';
    if (secret.length <= 4) return '****';
    return `${secret.substring(0, 2)}${'*'.repeat(secret.length - 4)}${secret.substring(secret.length - 2)}`;
  };

  const regionOptions = [
    { value: 'ap-guangzhou', label: '广州' },
    { value: 'ap-shanghai', label: '上海' },
    { value: 'ap-beijing', label: '北京' },
    { value: 'ap-chengdu', label: '成都' },
    { value: 'ap-hongkong', label: '香港' },
    { value: 'ap-singapore', label: '新加坡' },
    { value: 'ap-tokyo', label: '东京' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">云端存储设置</h2>

      <SettingsSection title="云存储配置">
        <SettingsItem label="启用云存储" description="启用后将数据同步到云端">
          <input
            type="checkbox"
            checked={config.cloudStorage.enabled}
            onChange={(e) => setConfig({ cloudStorage: { ...config.cloudStorage, enabled: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <div>
          <label className="mb-2 block text-sm font-medium">云存储提供商</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.cloudStorage.provider}
            onChange={(e) => setConfig({ cloudStorage: { ...config.cloudStorage, provider: e.target.value as any } })}
          >
            <option value="cos">腾讯云 COS</option>
            <option value="s3">AWS S3</option>
            <option value="oss">阿里云 OSS</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">同步策略</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.cloudStorage.syncStrategy}
            onChange={(e) =>
              setConfig({ cloudStorage: { ...config.cloudStorage, syncStrategy: e.target.value as any } })
            }
          >
            <option value="auto">自动同步</option>
            <option value="manual">手动同步</option>
            <option value="wifi-only">仅 WiFi 同步</option>
          </select>
        </div>
      </SettingsSection>

      <SettingsSection title="腾讯云 COS 配置">
        <div>
          <label className="mb-2 block text-sm font-medium">SecretId</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={maskSecret(config.cloudStorage.cosConfig.secretId)}
            onChange={(e) =>
              setConfig({
                cloudStorage: {
                  ...config.cloudStorage,
                  cosConfig: { ...config.cloudStorage.cosConfig, secretId: e.target.value }
                }
              })
            }
            placeholder="输入腾讯云 SecretId"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">SecretKey</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={maskSecret(config.cloudStorage.cosConfig.secretKey)}
            onChange={(e) =>
              setConfig({
                cloudStorage: {
                  ...config.cloudStorage,
                  cosConfig: { ...config.cloudStorage.cosConfig, secretKey: e.target.value }
                }
              })
            }
            placeholder="输入腾讯云 SecretKey"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">地域</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.cloudStorage.cosConfig.region}
            onChange={(e) =>
              setConfig({
                cloudStorage: {
                  ...config.cloudStorage,
                  cosConfig: { ...config.cloudStorage.cosConfig, region: e.target.value }
                }
              })
            }
          >
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">存储桶名称</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.cloudStorage.cosConfig.bucket}
            onChange={(e) =>
              setConfig({
                cloudStorage: {
                  ...config.cloudStorage,
                  cosConfig: { ...config.cloudStorage.cosConfig, bucket: e.target.value }
                }
              })
            }
            placeholder="输入存储桶名称"
          />
        </div>
      </SettingsSection>
    </div>
  );
};

export { CloudSettings };
