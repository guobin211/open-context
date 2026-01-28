import { getCurrentWindow } from '@tauri-apps/api/window';
import type { PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';

export interface WindowOptions {
  title?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  resizable?: boolean;
  decorations?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
}

/**
 * Tauri Window Service
 *
 * 提供窗口管理功能：打开、关闭、显示、隐藏窗口
 */
export class TauriWindowService {
  private currentWindow = getCurrentWindow();

  /**
   * 显示当前窗口
   */
  async show(): Promise<void> {
    try {
      await this.currentWindow.show();
      console.log('Window shown');
    } catch (error) {
      console.error('Error showing window:', error);
      throw error;
    }
  }

  /**
   * 隐藏当前窗口
   */
  async hide(): Promise<void> {
    try {
      await this.currentWindow.hide();
      console.log('Window hidden');
    } catch (error) {
      console.error('Error hiding window:', error);
      throw error;
    }
  }

  /**
   * 关闭当前窗口
   */
  async close(): Promise<void> {
    try {
      await this.currentWindow.close();
      console.log('Window closed');
    } catch (error) {
      console.error('Error closing window:', error);
      throw error;
    }
  }

  /**
   * 最小化当前窗口
   */
  async minimize(): Promise<void> {
    try {
      await this.currentWindow.minimize();
      console.log('Window minimized');
    } catch (error) {
      console.error('Error minimizing window:', error);
      throw error;
    }
  }

  /**
   * 最大化/还原当前窗口
   */
  async maximize(): Promise<void> {
    try {
      await this.currentWindow.toggleMaximize();
      console.log('Window toggled maximize');
    } catch (error) {
      console.error('Error toggling maximize:', error);
      throw error;
    }
  }

  /**
   * 检查窗口是否可见
   */
  async isVisible(): Promise<boolean> {
    try {
      return await this.currentWindow.isVisible();
    } catch (error) {
      console.error('Error checking window visibility:', error);
      return false;
    }
  }

  /**
   * 检查窗口是否最大化
   */
  async isMaximized(): Promise<boolean> {
    try {
      return await this.currentWindow.isMaximized();
    } catch (error) {
      console.error('Error checking window maximize state:', error);
      return false;
    }
  }

  /**
   * 检查窗口是否最小化
   */
  async isMinimized(): Promise<boolean> {
    try {
      return await this.currentWindow.isMinimized();
    } catch (error) {
      console.error('Error checking window minimize state:', error);
      return false;
    }
  }

  /**
   * 设置窗口标题
   */
  async setTitle(title: string): Promise<void> {
    try {
      await this.currentWindow.setTitle(title);
      console.log('Window title set to:', title);
    } catch (error) {
      console.error('Error setting window title:', error);
      throw error;
    }
  }

  /**
   * 设置窗口大小
   */
  async setSize(width: number, height: number): Promise<void> {
    try {
      await this.currentWindow.setSize({ width, height } as PhysicalSize);
      console.log('Window size set to:', { width, height });
    } catch (error) {
      console.error('Error setting window size:', error);
      throw error;
    }
  }

  /**
   * 设置窗口位置
   */
  async setPosition(x: number, y: number): Promise<void> {
    try {
      await this.currentWindow.setPosition({ x, y } as PhysicalPosition);
      console.log('Window position set to:', { x, y });
    } catch (error) {
      console.error('Error setting window position:', error);
      throw error;
    }
  }

  /**
   * 设置窗口为始终置顶
   */
  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    try {
      await this.currentWindow.setAlwaysOnTop(alwaysOnTop);
      console.log('Window always on top set to:', alwaysOnTop);
    } catch (error) {
      console.error('Error setting always on top:', error);
      throw error;
    }
  }

  /**
   * 设置窗口是否可调整大小
   */
  async setResizable(resizable: boolean): Promise<void> {
    try {
      await this.currentWindow.setResizable(resizable);
      console.log('Window resizable set to:', resizable);
    } catch (error) {
      console.error('Error setting resizable:', error);
      throw error;
    }
  }

  /**
   * 聚焦当前窗口
   */
  async setFocus(): Promise<void> {
    try {
      await this.currentWindow.setFocus();
      console.log('Window focused');
    } catch (error) {
      console.error('Error setting window focus:', error);
      throw error;
    }
  }

  /**
   * 开始拖动窗口（用于自定义标题栏）
   */
  async startDragging(): Promise<void> {
    try {
      await this.currentWindow.startDragging();
      console.log('Window dragging started');
    } catch (error) {
      console.error('Error starting window drag:', error);
      throw error;
    }
  }
}

// ==================== 导出服务实例 ====================

export const windowService = new TauriWindowService();
