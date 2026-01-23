export const HEADER_HEIGHT = 'h-10';
export const SIDEBAR_WIDTH = 'w-52';
export const EXPLORER_WIDTH = 'w-60';

export const STORAGE_KEYS = {
  CHAT: 'chat-sessions',
  NOTEBOOK: 'notebook-groups',
  FILES: 'file-groups',
  WORKSPACE: 'workspace',
  TABS: 'tabs',
  SIDEBAR: 'sidebar',
  RIGHT_SIDEBAR: 'right-sidebar',
  SETTINGS: 'settings'
} as const;

export const DEFAULT_SESSION_TITLE = '新会话';
export const MAX_RECENT_FOLDERS = 10;
export const MAX_RECENT_FILES = 5;
