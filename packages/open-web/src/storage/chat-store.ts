import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;

  // Actions
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ChatSession>) => void;

  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearSessions: () => void;
}

export const defaultSessionId = uuidv4();

// Mock Data
export const mockSessions: ChatSession[] = [
  {
    id: defaultSessionId,
    title: '新会话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const useChatStore = create<ChatStore>((set) => ({
  sessions: mockSessions,
  activeSessionId: defaultSessionId,

  createSession: (title = '新会话') => {
    const id = uuidv4();
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
      id: uuidv4(),
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
}));
