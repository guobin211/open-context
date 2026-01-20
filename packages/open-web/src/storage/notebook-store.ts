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

export interface NoteGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

interface NotebookState {
  noteGroups: NoteGroup[];
  addNote: (note: Omit<NavItem, 'id'>, groupId?: string, parentId?: string) => void;
  updateNote: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteNote: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
}

const generateId = () => uuidv4();

export const mockNoteGroups: NoteGroup[] = [
  {
    id: 'my-notes',
    label: '我的笔记',
    icon: 'FileText',
    items: [
      {
        id: 'note-1',
        label: '工作笔记',
        icon: 'Briefcase',
        type: 'note',
        children: [
          { id: 'note-1-1', label: '项目A进展', icon: 'FileText', type: 'note' },
          { id: 'note-1-2', label: '周报总结', icon: 'FileText', type: 'note' }
        ]
      },
      { id: 'note-2', label: '会议纪要', icon: 'Users', type: 'note' },
      { id: 'note-3', label: '代码片段', icon: 'Code', type: 'note' },
      { id: 'note-4', label: '学习笔记', icon: 'BookOpen', type: 'note' }
    ]
  },
  {
    id: 'note-favorites',
    label: '收藏',
    icon: 'Star',
    items: [
      { id: 'note-fav-1', label: '技术文章收藏', icon: 'FileText', type: 'note' },
      { id: 'note-fav-2', label: '教程收藏', icon: 'BookOpen', type: 'note' }
    ]
  }
];

export const useNotebookStore = create<NotebookState>((set) => ({
  noteGroups: mockNoteGroups,

  addNote: (note: Omit<NavItem, 'id'>, groupId: string = 'my-notes', parentId?: string) => {
    set((state) => {
      const addToGroup = (groups: NoteGroup[]): NoteGroup[] => {
        return groups.map((group) => {
          if (group.id === groupId) {
            if (parentId) {
              const addToChildren = (items: NavItem[]): NavItem[] => {
                return items.map((item) => {
                  if (item.id === parentId) {
                    return {
                      ...item,
                      children: [...(item.children || []), { ...note, id: generateId() }]
                    };
                  }
                  if (item.children) {
                    return { ...item, children: addToChildren(item.children) };
                  }
                  return item;
                });
              };
              return { ...group, items: addToChildren(group.items) };
            }
            return { ...group, items: [...group.items, { ...note, id: generateId() }] };
          }
          return group;
        });
      };
      return { noteGroups: addToGroup(state.noteGroups) };
    });
  },

  updateNote: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => {
      const updateInTree = (items: NavItem[]): NavItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return { ...item, children: updateInTree(item.children) };
          }
          return item;
        });
      };
      return {
        noteGroups: state.noteGroups.map((group) => ({
          ...group,
          items: updateInTree(group.items)
        }))
      };
    });
  },

  deleteNote: (id: string) => {
    set((state) => {
      const deleteFromTree = (items: NavItem[]): NavItem[] => {
        return items
          .filter((item) => item.id !== id)
          .map((item) => ({
            ...item,
            children: item.children ? deleteFromTree(item.children) : undefined
          }));
      };
      return {
        noteGroups: state.noteGroups.map((group) => ({
          ...group,
          items: deleteFromTree(group.items)
        }))
      };
    });
  },

  toggleFavoriteNote: (id: string) => {
    set((state) => {
      const myNotesGroup = state.noteGroups.find((g) => g.id === 'my-notes');
      const favoritesGroup = state.noteGroups.find((g) => g.id === 'note-favorites');

      if (!myNotesGroup || !favoritesGroup) return state;

      const findInTree = (items: NavItem[]): NavItem | null => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findInTree(item.children);
            if (found) return found;
          }
        }
        return null;
      };

      const itemInMyNotes = findInTree(myNotesGroup.items);
      const itemInFavorites = findInTree(favoritesGroup.items);

      const removeFromTree = (items: NavItem[]): NavItem[] => {
        return items
          .filter((item) => item.id !== id)
          .map((item) => ({
            ...item,
            children: item.children ? removeFromTree(item.children) : undefined
          }));
      };

      if (itemInMyNotes) {
        return {
          noteGroups: state.noteGroups.map((group) => {
            if (group.id === 'my-notes') {
              return { ...group, items: removeFromTree(group.items) };
            }
            if (group.id === 'note-favorites') {
              return { ...group, items: [...group.items, itemInMyNotes] };
            }
            return group;
          })
        };
      }

      if (itemInFavorites) {
        return {
          noteGroups: state.noteGroups.map((group) => {
            if (group.id === 'note-favorites') {
              return { ...group, items: removeFromTree(group.items) };
            }
            if (group.id === 'my-notes') {
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
