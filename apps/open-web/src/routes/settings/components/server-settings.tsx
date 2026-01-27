import { useSettingsStore } from '../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { SettingsItem } from './settings-item';

const ServerSettings = () => {
  const { config, setConfig } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">服务器设置</h2>

      <SettingsSection title="Open-Node 服务">
        <div>
          <label className="mb-2 block text-sm font-medium">服务地址</label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.server.nodeServerUrl}
            onChange={(e) => setConfig({ server: { ...config.server, nodeServerUrl: e.target.value } })}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">端口</label>
          <input
            type="number"
            min="1024"
            max="65535"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.server.nodeServerPort}
            onChange={(e) =>
              setConfig({ server: { ...config.server, nodeServerPort: Number.parseInt(e.target.value) } })
            }
          />
        </div>
      </SettingsSection>

      <SettingsSection title="服务配置">
        <SettingsItem label="启用 Open-Node 服务" description="启用 Node.js 后端服务">
          <input
            type="checkbox"
            checked={config.server.nodeServerEnabled}
            onChange={(e) => setConfig({ server: { ...config.server, nodeServerEnabled: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="自动启动服务" description="应用启动时自动启动 Node.js 服务">
          <input
            type="checkbox"
            checked={config.server.autoStartServer}
            onChange={(e) => setConfig({ server: { ...config.server, autoStartServer: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="启用 MCP 服务" description="启用 Model Context Protocol 服务">
          <input
            type="checkbox"
            checked={config.server.mcpEnabled}
            onChange={(e) => setConfig({ server: { ...config.server, mcpEnabled: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>

        <SettingsItem label="启用 HTTP API" description="启用 HTTP API 接口">
          <input
            type="checkbox"
            checked={config.server.httpApiEnabled}
            onChange={(e) => setConfig({ server: { ...config.server, httpApiEnabled: e.target.checked } })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </SettingsItem>
      </SettingsSection>
    </div>
  );
};

export { ServerSettings };
