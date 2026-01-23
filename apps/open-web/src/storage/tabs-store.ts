import { create } from 'zustand';

export const MAX_TABS = 10;

export interface Tab {
  id: string;
  label: string;
  type: 'chat' | 'note' | 'file';
  icon?: string;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Tab) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabLabel: (id: string, label: string) => void;
}

export const useTabsStore = create<TabsState>((set) => ({
  tabs: [],
  activeTabId: null,

  addTab: (tab: Tab) =>
    set((state) => {
      const existingTab = state.tabs.find((t) => t.id === tab.id);
      if (existingTab) {
        return { activeTabId: tab.id };
      }
      // 最多打开 MAX_TABS 个文件，超出时移除最早打开的 tab
      let newTabs = [...state.tabs, tab];
      if (newTabs.length > MAX_TABS) {
        newTabs = newTabs.slice(1);
      }
      return {
        tabs: newTabs,
        activeTabId: tab.id
      };
    }),

  removeTab: (id: string) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === id) {
        const index = state.tabs.findIndex((t) => t.id === id);
        if (newTabs.length > 0) {
          newActiveTabId = newTabs[Math.max(0, index - 1)]?.id || null;
        } else {
          newActiveTabId = null;
        }
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId
      };
    }),

  setActiveTab: (id: string) => set({ activeTabId: id }),

  updateTabLabel: (id: string, label: string) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, label } : t))
    }))
}));
