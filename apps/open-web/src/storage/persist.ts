import { Store } from '@tauri-apps/plugin-store';

export const createTauriStorage = () => ({
  getItem: async (name: string): Promise<string | null> => {
    try {
      const store = await Store.load('store.json');
      const value = await store.get(name);
      return value ? JSON.stringify(value) : null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const store = await Store.load('store.json');
      await store.set(name, JSON.parse(value));
      await store.save();
    } catch {}
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const store = await Store.load('store.json');
      await store.delete(name);
      await store.save();
    } catch {}
  }
});
