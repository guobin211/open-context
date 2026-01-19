import type { IDataProvider, DataProviderConfig } from './types';
import { tauriServices } from './tauri-services';
import { createHttpServices } from './http-services';

// ==================== 服务提供者工厂 ====================

class DataProviderFactory {
  private static instance: IDataProvider | null = null;

  /**
   * 创建数据提供者
   * @param config 配置对象
   * @returns 数据提供者实例
   */
  static create(config: DataProviderConfig): IDataProvider {
    switch (config.type) {
      case 'tauri':
        console.log('Using Tauri data provider');
        return tauriServices;

      case 'http':
        console.log('Using HTTP data provider with base URL:', config.baseUrl || 'http://localhost:4500');
        return createHttpServices(config.baseUrl);

      default:
        console.warn('Unknown data provider type, falling back to Tauri');
        return tauriServices;
    }
  }

  /**
   * 获取或创建默认数据提供者
   * 默认使用 Tauri
   * @returns 数据提供者实例
   */
  static getOrCreateDefault(): IDataProvider {
    if (!this.instance) {
      // 默认使用 Tauri
      this.instance = this.create({ type: 'tauri' });
    }
    return this.instance;
  }

  /**
   * 设置全局数据提供者
   * @param config 配置对象
   */
  static setGlobal(config: DataProviderConfig): void {
    this.instance = this.create(config);
  }

  /**
   * 重置数据提供者
   */
  static reset(): void {
    this.instance = null;
  }
}

// ==================== 导出 ====================

// 导出工厂类
export { DataProviderFactory };

// 导出类型
export type * from './types';

// 导出服务提供者
export { tauriServices };
export { createHttpServices };

// ==================== 使用示例 ====================

/*
// 使用默认数据提供者（Tauri）
import { DataProviderFactory } from '@/services';

const services = DataProviderFactory.getOrCreateDefault();

// 使用工作空间服务
const workspaces = await services.workspace.getAll();

// 使用 HTTP 数据提供者
DataProviderFactory.setGlobal({
  type: 'http',
  baseUrl: 'http://localhost:4500'
});

const httpServices = DataProviderFactory.getOrCreateDefault();
const workspaces2 = await httpServices.workspace.getAll();

// 在组件中使用
import { DataProviderFactory } from '@/services';

function MyComponent() {
  const services = DataProviderFactory.getOrCreateDefault();

  const fetchWorkspaces = async () => {
    try {
      const workspaces = await services.workspace.getAll();
      console.log('Workspaces:', workspaces);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  return <div>...</div>;
}
*/

// ==================== React Hook ====================

import { useCallback } from 'react';

export function useDataProvider() {
  const getServices = useCallback(() => {
    return DataProviderFactory.getOrCreateDefault();
  }, []);

  return { getServices };
}

export function useWorkspaceService() {
  const { getServices } = useDataProvider();
  const services = getServices();

  return services.workspace;
}

export function useNoteService() {
  const { getServices } = useDataProvider();
  const services = getServices();

  return services.note;
}

export function useFileService() {
  const { getServices } = useDataProvider();
  const services = getServices();

  return services.file;
}

export function useRepositoryService() {
  const { getServices } = useDataProvider();
  const services = getServices();

  return services.repository;
}
