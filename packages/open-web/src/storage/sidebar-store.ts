import { create } from 'zustand';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  type: 'note' | 'file' | 'space' | 'conversation';
  children?: NavItem[];
  color?: string;
}

interface SidebarState {
  activeItemId: string | null;
  expandedIds: Set<string>;
  setActiveItem: (id: string) => void;
  toggleExpand: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  activeItemId: 'conv-1',
  expandedIds: new Set(['conversation-list', 'my-notes', 'all-files']),

  setActiveItem: (id: string) => set({ activeItemId: id }),

  toggleExpand: (id: string) =>
    set((state) => {
      const newExpandedIds = new Set(state.expandedIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      return { expandedIds: newExpandedIds };
    }),

  isExpanded: (id: string) => get().expandedIds.has(id)
}));
