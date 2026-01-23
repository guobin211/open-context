import { create } from 'zustand';
import type { FileGroup, NavItem, FileCategory } from './types';
import { mockFileGroups } from './mock-data';
import { generateId } from './utils';

export type { FileGroup, NavItem, FileCategory };

interface FilesStore {
  fileGroups: FileGroup[];
  addFile: (file: Omit<NavItem, 'id'>, groupId?: string, categoryId?: string) => void;
  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteFile: (id: string) => void;
  addToRecentFiles: (file: Omit<NavItem, 'id'>) => void;
}

export const useFilesStore = create<FilesStore>((set) => ({
  fileGroups: mockFileGroups,

  addFile: (file: Omit<NavItem, 'id'>, groupId = 'all-files', categoryId?: string) => {
    set((state) => ({
      fileGroups: state.fileGroups.map((group) => {
        if (group.id === groupId) {
          if (categoryId && group.categories) {
            return {
              ...group,
              categories: group.categories.map((category: FileCategory) =>
                category.id === categoryId
                  ? { ...category, items: [...category.items, { ...file, id: generateId() }] }
                  : category
              )
            };
          }
          return { ...group, items: [...group.items, { ...file, id: generateId() }] };
        }
        return group;
      })
    }));
  },

  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => ({
      fileGroups: state.fileGroups.map((group) => {
        const updatedCategories = group.categories?.map((category: FileCategory) => ({
          ...category,
          items: category.items.map((item) => (item.id === id ? { ...item, ...updates } : item))
        }));

        const updatedItems = group.items.map((item) => (item.id === id ? { ...item, ...updates } : item));

        return {
          ...group,
          categories: updatedCategories,
          items: updatedItems
        };
      })
    }));
  },

  deleteFile: (id: string) => {
    set((state) => ({
      fileGroups: state.fileGroups.map((group) => {
        const updatedCategories = group.categories?.map((category: FileCategory) => ({
          ...category,
          items: category.items.filter((item) => item.id !== id)
        }));

        const updatedItems = group.items.filter((item) => item.id !== id);

        return {
          ...group,
          categories: updatedCategories,
          items: updatedItems
        };
      })
    }));
  },

  addToRecentFiles: (file: Omit<NavItem, 'id'>) => {
    set((state) => ({
      fileGroups: state.fileGroups.map((group) => {
        if (group.id === 'recent-files') {
          const newFile = { ...file, id: generateId() };
          const filteredItems = group.items.filter((item) => item.label !== file.label);
          const updatedItems = [newFile, ...filteredItems].slice(0, 5);

          return { ...group, items: updatedItems };
        }
        return group;
      })
    }));
  }
}));
