/**
 * 公共类型定义
 */

export type NavItemType = 'note' | 'file' | 'space' | 'conversation';
export type SpaceResourceType = 'repo' | 'doc' | 'file';
export type ViewMode = 'grid' | 'card' | 'list';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  type: NavItemType;
  children?: NavItem[];
  color?: string;
  isGroup?: boolean;
}

export interface FileCategory {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

export interface FileGroup {
  id: string;
  label: string;
  icon: string;
  categories?: FileCategory[];
  items: NavItem[];
}

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

export interface SpaceResource {
  id: string;
  label: string;
  icon: string;
  type: SpaceResourceType;
  repoUrl?: string;
  branch?: string;
  path?: string;
  children?: SpaceResource[];
}

export interface Space {
  id: string;
  label: string;
  icon: string;
  color?: string;
  repos: SpaceResource[];
  docs: SpaceResource[];
  files: SpaceResource[];
}

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

export interface NoteGroup {
  id: string;
  label: string;
  icon: string;
  items: NavItem[];
}

export interface Tab {
  id: string;
  label: string;
  type: 'chat' | 'note' | 'file';
  path?: string;
}

export interface SidebarState {
  chatExpanded: boolean;
  noteExpanded: boolean;
  resourcesExpanded: boolean;
  workspaceExpanded: boolean;
}
