// Workspace 类型定义

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
  isArchived: boolean;
  settings?: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

export interface CreateWorkspaceDto {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  isActive?: boolean;
  isArchived?: boolean;
  settings?: Record<string, unknown>;
}

// Note 类型定义

export interface Note {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  title: string;
  noteType: string;
  content: string;
  summary?: string | null;
  filePath: string;
  tags?: string[] | null;
  wordCount: number;
  sortOrder: number;
  isFavorited: boolean;
  isPinned: boolean;
  isArchived: boolean;
  lastViewedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// ImportedFile 类型定义

export interface ImportedFile {
  id: string;
  workspaceId: string;
  parentDirectoryId?: string | null;
  name: string;
  originalPath: string;
  storedPath: string;
  fileType: string;
  sizeBytes: number;
  mimeType?: string | null;
  checksum?: string | null;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

// ImportedDirectory 类型定义

export interface ImportedDirectory {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  name: string;
  originalPath: string;
  storedPath: string;
  fileCount: number;
  totalSizeBytes: number;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
}

// WebLink 类型定义

export interface WebLink {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  description?: string | null;
  faviconUrl?: string | null;
  thumbnailUrl?: string | null;
  tags?: string[] | null;
  content?: string | null;
  isFavorited: boolean;
  isArchived: boolean;
  visitCount: number;
  lastVisitedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Conversation 类型定义

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  chatId?: string | null;
  title: string;
  model?: string | null;
  systemPrompt?: string | null;
  messages: ConversationMessage[];
  messageCount: number;
  tokenCount: number;
  isFavorited: boolean;
  isArchived: boolean;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Chat 类型定义

export interface Chat {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  defaultModel?: string | null;
  defaultPrompt?: string | null;
  conversationCount: number;
  isActive: boolean;
  isArchived: boolean;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Terminal 类型定义

export interface Terminal {
  id: string;
  workspaceId: string;
  name: string;
  shell: string;
  cwd: string;
  env?: Record<string, string> | null;
  history: string[];
  historyCount: number;
  isActive: boolean;
  isArchived: boolean;
  lastCommandAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Webview 类型定义

export interface Webview {
  id: string;
  workspaceId: string;
  title: string;
  url: string;
  faviconUrl?: string | null;
  history: string[];
  isLoading: boolean;
  isActive: boolean;
  isArchived: boolean;
  scrollX: number;
  scrollY: number;
  zoomLevel: number;
  lastActiveAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

// Task 类型定义

export interface Task {
  id: string;
  taskType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string | null;
  result?: Record<string, unknown> | null;
  error?: string | null;
  retryCount: number;
  maxRetries: number;
  retryDelayMs: number;
  input?: Record<string, unknown> | null;
  persistent: boolean;
  createdAt: number;
  updatedAt: number;
  completedAt?: number | null;
}
