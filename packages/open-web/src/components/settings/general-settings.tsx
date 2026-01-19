import { useSettingsStore } from '../../zustand/settings-store';

const GeneralSettings = () => {
  const { config, setConfig } = useSettingsStore();

  return (
    <div className="space-y-6">
      <h2 className="mb-4 text-lg font-semibold">通用设置</h2>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium">语言</label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={config.language}
            onChange={(e) => setConfig({ language: e.target.value as 'zh-CN' | 'en-US' })}
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export { GeneralSettings };
