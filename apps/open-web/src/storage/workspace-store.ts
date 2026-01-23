import { create } from 'zustand';
import type { Space, SpaceResource } from './types';
import { mockSpaces } from './mock-data';
import { generateId } from './utils';

export type { Space, SpaceResource };

interface WorkspaceState {
  spaces: Space[];
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Omit<Space, 'id'>>) => void;
  deleteSpace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  spaces: mockSpaces,

  addSpace: (space: Omit<Space, 'id'>) => {
    set((state) => ({
      spaces: [...state.spaces, { ...space, id: generateId() }]
    }));
  },

  updateSpace: (id: string, updates: Partial<Omit<Space, 'id'>>) => {
    set((state) => ({
      spaces: state.spaces.map((space) => (space.id === id ? { ...space, ...updates } : space))
    }));
  },

  deleteSpace: (id: string) => {
    set((state) => ({
      spaces: state.spaces.filter((space) => space.id !== id)
    }));
  }
}));
