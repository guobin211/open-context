import { create } from 'zustand';
import { getStoreFilePath } from '@/config';

let Store: any = null;

const loadStore = async () => {
  if (Store) return Store;
  try {
    const mod = await import('@tauri-apps/plugin-store');
    Store = mod.Store;
    return Store;
  } catch {
    return null;
  }
};

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface RecentFolder {
  name: string;
  path: string;
  lastAccessed: number;
}

interface RightSidebarState {
  isOpen: boolean;
  folderPath: string | null;
  fileTree: FileNode[];
  isLoading: boolean;
  recentFolders: RecentFolder[];
  /* oxlint-disable */
  store: any | null;

  setOpen: (open: boolean) => void;
  setFolderPath: (path: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  setLoading: (loading: boolean) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;

  initStore: () => Promise<void>;
  addRecentFolder: (path: string) => Promise<void>;
  removeRecentFolder: (path: string) => Promise<void>;
}

const MAX_RECENT_FOLDERS = 10;

export const useRightSidebarStore = create<RightSidebarState>((set, get) => ({
  isOpen: false,
  folderPath: null,
  fileTree: [],
  isLoading: false,
  recentFolders: [],
  store: null,

  setOpen: (open: boolean) => set({ isOpen: open }),

  setFolderPath: (path: string | null) => set({ folderPath: path }),

  setFileTree: (tree: FileNode[]) => set({ fileTree: tree }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),

  reset: () =>
    set({
      folderPath: null,
      fileTree: [],
      isLoading: false
    }),

  initStore: async () => {
    try {
      const StoreClass = await loadStore();
      if (!StoreClass) return;
      const storePath = await getStoreFilePath('RIGHT_SIDEBAR');
      const store = await StoreClass.load(storePath);
      set({ store });

      const recentFolders = await store.get('recentFolders');
      if (recentFolders) {
        set({ recentFolders });
      }
    } catch (error) {
      console.error('Failed to initialize right sidebar store:', error);
    }
  },

  addRecentFolder: async (path: string) => {
    const { store, recentFolders } = get();
    if (!store) return;

    const folderName = path.split('/').pop() || path;
    const existingIndex = recentFolders.findIndex((f) => f.path === path);

    let updatedFolders: RecentFolder[];

    if (existingIndex !== -1) {
      updatedFolders = [...recentFolders];
      updatedFolders[existingIndex].lastAccessed = Date.now();
      updatedFolders.sort((a, b) => b.lastAccessed - a.lastAccessed);
    } else {
      const newFolder: RecentFolder = {
        name: folderName,
        path,
        lastAccessed: Date.now()
      };
      updatedFolders = [newFolder, ...recentFolders].slice(0, MAX_RECENT_FOLDERS);
    }

    set({ recentFolders: updatedFolders });

    try {
      await store.set('recentFolders', updatedFolders);
      await store.save();
    } catch (error) {
      console.error('Failed to save recent folders:', error);
    }
  },

  removeRecentFolder: async (path: string) => {
    const { store, recentFolders } = get();
    if (!store) return;

    const updatedFolders = recentFolders.filter((f) => f.path !== path);
    set({ recentFolders: updatedFolders });

    try {
      await store.set('recentFolders', updatedFolders);
      await store.save();
    } catch (error) {
      console.error('Failed to remove recent folder:', error);
    }
  }
}));
