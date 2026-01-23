import { create } from 'zustand';
import type { NoteGroup, NavItem } from './types';
import { mockNoteGroups } from './mock-data';
import { generateId, searchInTree, updateInTree, deleteFromTree } from './utils';

export type { NoteGroup, NavItem };

interface NotebookState {
  noteGroups: NoteGroup[];
  addNote: (note: Omit<NavItem, 'id'>, groupId?: string, parentId?: string) => void;
  updateNote: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteNote: (id: string) => void;
  toggleFavoriteNote: (id: string) => void;
}

export const useNotebookStore = create<NotebookState>((set) => ({
  noteGroups: mockNoteGroups,

  addNote: (note: Omit<NavItem, 'id'>, groupId = 'my-notes', parentId?: string) => {
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
    set((state) => ({
      noteGroups: state.noteGroups.map((group) => ({
        ...group,
        items: updateInTree(group.items, id, updates)
      }))
    }));
  },

  deleteNote: (id: string) => {
    set((state) => ({
      noteGroups: state.noteGroups.map((group) => ({
        ...group,
        items: deleteFromTree(group.items, id)
      }))
    }));
  },

  toggleFavoriteNote: (id: string) => {
    set((state) => {
      const myNotesGroup = state.noteGroups.find((g) => g.id === 'my-notes');
      const favoritesGroup = state.noteGroups.find((g) => g.id === 'note-favorites');

      if (!myNotesGroup || !favoritesGroup) return state;

      const itemInMyNotes = searchInTree(myNotesGroup.items, id);
      const itemInFavorites = searchInTree(favoritesGroup.items, id);

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
