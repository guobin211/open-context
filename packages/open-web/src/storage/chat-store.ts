import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { ChatMessage, ChatSession } from './types';
import { mockSessions, defaultSessionId } from './mock-data';
import { generateId } from './utils';
import { STORAGE_KEYS, DEFAULT_SESSION_TITLE } from './constants';

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;

  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearSessions: () => void;
}

const loadFromTauri = async <T>(key: string): Promise<T | null> => {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('~/.open-context/cache/chat-store.store.json');
    const value = await store.get(key);
    return value as T | null;
  } catch {
    return null;
  }
};

const saveToTauri = async (key: string, value: unknown): Promise<void> => {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('~/.open-context/cache/chat-store.store.json');
    await store.set(key, value);
    await store.save();
  } catch {}
};

const deleteFromTauri = async (key: string): Promise<void> => {
  try {
    const { Store } = await import('@tauri-apps/plugin-store');
    const store = await Store.load('~/.open-context/cache/chat-store.store.json');
    await store.delete(key);
    await store.save();
  } catch {}
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      sessions: mockSessions,
      activeSessionId: defaultSessionId,

      createSession: (title = DEFAULT_SESSION_TITLE) => {
        const id = generateId();
        const newSession: ChatSession = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: id
        }));
        return id;
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const newSessions = state.sessions.filter((s) => s.id !== sessionId);
          return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === sessionId ? newSessions[0]?.id || null : state.activeSessionId
          };
        });
      },

      setActiveSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
      },

      updateSession: (sessionId: string, updates: Partial<ChatSession>) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...updates, updatedAt: Date.now() } : s))
        }));
      },

      addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
          timestamp: Date.now()
        };

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === sessionId) {
              return {
                ...s,
                messages: [...s.messages, newMessage],
                updatedAt: Date.now()
              };
            }
            return s;
          })
        }));
      },

      clearSessions: () => {
        set({ sessions: [], activeSessionId: null });
      }
    }),
    {
      name: STORAGE_KEYS.CHAT,
      storage: createJSONStorage(() => ({
        getItem: async (name: string): Promise<string | null> => {
          const value = await loadFromTauri(name);
          return value ? JSON.stringify(value) : null;
        },
        setItem: async (name: string, value: string): Promise<void> => {
          await saveToTauri(name, JSON.parse(value));
        },
        removeItem: async (name: string): Promise<void> => {
          await deleteFromTauri(name);
        }
      }))
    }
  )
);

export { defaultSessionId };
