import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  type: 'note' | 'file' | 'space' | 'conversation';
  children?: NavItem[];
  color?: string;
}

export interface ConversationGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

interface SidebarChatState {
  conversationGroups: ConversationGroup[];
  addConversation: (conversation: Omit<NavItem, 'id'>, groupId?: string) => void;
  updateConversation: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteConversation: (id: string) => void;
  toggleFavoriteConversation: (id: string) => void;
}

const generateId = () => uuidv4();

export const mockConversationGroups: ConversationGroup[] = [
  {
    id: 'conversation-list',
    label: '会话列表',
    icon: 'MessageSquare',
    items: [
      { id: 'conv-1', label: '如何优化 React 性能', icon: 'MessageSquare', type: 'conversation' },
      { id: 'conv-2', label: 'TypeScript 类型编程', icon: 'MessageSquare', type: 'conversation' },
      { id: 'conv-3', label: 'Rust 所有权机制', icon: 'MessageSquare', type: 'conversation' }
    ]
  },
  {
    id: 'conversation-favorites',
    label: '收藏',
    icon: 'Star',
    items: [{ id: 'conv-fav-1', label: '重要的技术讨论', icon: 'MessageSquare', type: 'conversation' }]
  }
];

export const useSidebarChatStore = create<SidebarChatState>((set) => ({
  conversationGroups: mockConversationGroups,

  addConversation: (conversation: Omit<NavItem, 'id'>, groupId: string = 'conversation-list') => {
    set((state) => ({
      conversationGroups: state.conversationGroups.map((group) =>
        group.id === groupId ? { ...group, items: [...group.items, { ...conversation, id: generateId() }] } : group
      )
    }));
  },

  updateConversation: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => ({
      conversationGroups: state.conversationGroups.map((group) => ({
        ...group,
        items: group.items.map((item) => (item.id === id ? { ...item, ...updates } : item))
      }))
    }));
  },

  deleteConversation: (id: string) => {
    set((state) => ({
      conversationGroups: state.conversationGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.id !== id)
      }))
    }));
  },

  toggleFavoriteConversation: (id: string) => {
    set((state) => {
      const conversationListGroup = state.conversationGroups.find((g) => g.id === 'conversation-list');
      const favoritesGroup = state.conversationGroups.find((g) => g.id === 'conversation-favorites');

      if (!conversationListGroup || !favoritesGroup) return state;

      const itemInList = conversationListGroup.items.find((item) => item.id === id);
      const itemInFavorites = favoritesGroup.items.find((item) => item.id === id);

      if (itemInList) {
        return {
          conversationGroups: state.conversationGroups.map((group) => {
            if (group.id === 'conversation-list') {
              return { ...group, items: group.items.filter((item) => item.id !== id) };
            }
            if (group.id === 'conversation-favorites') {
              return { ...group, items: [...group.items, itemInList] };
            }
            return group;
          })
        };
      }

      if (itemInFavorites) {
        return {
          conversationGroups: state.conversationGroups.map((group) => {
            if (group.id === 'conversation-favorites') {
              return { ...group, items: group.items.filter((item) => item.id !== id) };
            }
            if (group.id === 'conversation-list') {
              return { ...group, items: [...group.items, itemInFavorites] };
            }
            return group;
          })
        };
      }

      return state;
    });
  }
}));
