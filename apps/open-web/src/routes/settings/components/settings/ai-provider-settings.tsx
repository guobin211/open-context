import { useSettingsStore } from '../../../../storage/settings-store';
import { SettingsSection } from './settings-section';
import { Plus, Trash2 } from 'lucide-react';

const AIProviderSettings = () => {
  const { config, setConfig } = useSettingsStore();

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '****';
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  const addProvider = () => {
    const newProvider = {
      name: 'openai',
      apiKey: '',
      models: ['gpt-3.5-turbo'],
      baseUrl: ''
    };
    setConfig({
      aiProvider: { ...config.aiProvider, cloudProviders: [...config.aiProvider.cloudProviders, newProvider] }
    });
  };

  const removeProvider = (index: number) => {
    setConfig({
      aiProvider: {
        ...config.aiProvider,
        cloudProviders: config.aiProvider.cloudProviders.filter((_, i) => i !== index)
      }
    });
  };

  const updateProvider = (index: number, field: string, value: string) => {
    setConfig({
      aiProvider: {
        ...config.aiProvider,
        cloudProviders: config.aiProvider.cloudProviders.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">AI 提供商设置</h2>

      <SettingsSection title="模型类型选择">
        <div>
          <label className="mb-2 block text-sm font-medium">模型类型</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.aiProvider.type}
            onChange={(e) => setConfig({ aiProvider: { ...config.aiProvider, type: e.target.value as any } })}
          >
            <option value="local">本地模型</option>
            <option value="cloud">云端模型</option>
          </select>
        </div>

        {config.aiProvider.type === 'local' && (
          <div>
            <label className="mb-2 block text-sm font-medium">本地模型名称</label>
            <input
              type="text"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={config.aiProvider.localModel}
              onChange={(e) => setConfig({ aiProvider: { ...config.aiProvider, localModel: e.target.value } })}
            />
          </div>
        )}
      </SettingsSection>

      {config.aiProvider.type === 'cloud' && (
        <SettingsSection title="云端提供商配置">
          <div className="space-y-4">
            {config.aiProvider.cloudProviders.map((provider, index) => (
              <div key={index} className="rounded-md border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">提供商 {index + 1}</h4>
                  <button onClick={() => removeProvider(index)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">提供商名称</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={provider.name}
                      onChange={(e) => updateProvider(index, 'name', e.target.value)}
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="azure">Azure</option>
                      <option value="zhipu">智谱 AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">API Key</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={maskApiKey(provider.apiKey)}
                      onChange={(e) => updateProvider(index, 'apiKey', e.target.value)}
                      placeholder="输入 API Key"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium">Base URL（可选）</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      value={provider.baseUrl || ''}
                      onChange={(e) => updateProvider(index, 'baseUrl', e.target.value)}
                      placeholder="自定义 API 地址"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addProvider} className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <Plus className="h-4 w-4" />
              添加提供商
            </button>
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="模型参数">
        <div>
          <label className="mb-2 block text-sm font-medium">Temperature</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.aiProvider.modelParams.temperature}
              onChange={(e) =>
                setConfig({
                  aiProvider: {
                    ...config.aiProvider,
                    modelParams: { ...config.aiProvider.modelParams, temperature: Number.parseFloat(e.target.value) }
                  }
                })
              }
              className="flex-1"
            />
            <span className="w-12 text-sm font-medium text-gray-700">{config.aiProvider.modelParams.temperature}</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Max Tokens</label>
          <input
            type="number"
            min="1"
            max="4096"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.aiProvider.modelParams.maxTokens}
            onChange={(e) =>
              setConfig({
                aiProvider: {
                  ...config.aiProvider,
                  modelParams: { ...config.aiProvider.modelParams, maxTokens: Number.parseInt(e.target.value) }
                }
              })
            }
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Top P</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.aiProvider.modelParams.topP}
              onChange={(e) =>
                setConfig({
                  aiProvider: {
                    ...config.aiProvider,
                    modelParams: { ...config.aiProvider.modelParams, topP: Number.parseFloat(e.target.value) }
                  }
                })
              }
              className="flex-1"
            />
            <span className="w-12 text-sm font-medium text-gray-700">{config.aiProvider.modelParams.topP}</span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
};

export { AIProviderSettings };
