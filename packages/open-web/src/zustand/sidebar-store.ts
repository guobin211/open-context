import { create } from 'zustand';

// 空间内的资源类型
export type SpaceResourceType = 'repo' | 'doc' | 'file';

export interface SpaceResource {
  id: string;
  label: string;
  icon: string;
  type: SpaceResourceType;
  // Git 仓库特有属性
  repoUrl?: string;
  branch?: string;
  // 文档/文件特有属性
  path?: string;
  children?: SpaceResource[];
}

export interface Space {
  id: string;
  label: string;
  icon: string;
  color?: string;
  // 空间下的资源分组
  repos: SpaceResource[];
  docs: SpaceResource[];
  files: SpaceResource[];
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  type: 'note' | 'file' | 'space';
  children?: NavItem[];
  color?: string;
}

interface SidebarState {
  activeItemId: string | null;
  expandedIds: Set<string>;
  spaces: Space[];
  notes: NavItem[];
  files: NavItem[];
  setActiveItem: (id: string) => void;
  toggleExpand: (id: string) => void;
  isExpanded: (id: string) => boolean;

  // 工作空间管理
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Omit<Space, 'id'>>) => void;
  deleteSpace: (id: string) => void;

  // 笔记管理
  addNote: (note: Omit<NavItem, 'id'>, parentId?: string) => void;
  updateNote: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteNote: (id: string) => void;

  // 文件管理
  addFile: (file: Omit<NavItem, 'id'>, parentId?: string) => void;
  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteFile: (id: string) => void;
}

// Mock 空间数据
export const mockSpaces: Space[] = [
  {
    id: 'agent',
    label: 'agent',
    icon: 'Box',
    color: '#3B82F6',
    repos: [
      {
        id: 'claude-repo',
        label: 'anthropics/claude-sdk',
        icon: 'GitBranch',
        type: 'repo',
        repoUrl: 'https://github.com/anthropics/claude-sdk',
        branch: 'main',
        children: [
          { id: 'claude-src', label: 'src', icon: 'Folder', type: 'file' },
          { id: 'claude-docs', label: 'docs', icon: 'Folder', type: 'file' }
        ]
      },
      {
        id: 'openai-repo',
        label: 'openai/openai-python',
        icon: 'GitBranch',
        type: 'repo',
        repoUrl: 'https://github.com/openai/openai-python',
        branch: 'main'
      }
    ],
    docs: [
      { id: 'agent-overview', label: 'Agent SDK 概览', icon: 'FileText', type: 'doc' },
      { id: 'getting-started', label: '快速开始', icon: 'FileText', type: 'doc' },
      { id: 'api-reference', label: 'API 参考', icon: 'FileText', type: 'doc' }
    ],
    files: [
      { id: 'config-json', label: 'config.json', icon: 'File', type: 'file' },
      { id: 'readme-md', label: 'README.md', icon: 'File', type: 'file' }
    ]
  },
  {
    id: 'developer-tools',
    label: 'developer-tools',
    icon: 'Code',
    color: '#10B981',
    repos: [
      {
        id: 'vscode-ext',
        label: 'microsoft/vscode',
        icon: 'GitBranch',
        type: 'repo',
        repoUrl: 'https://github.com/microsoft/vscode',
        branch: 'main'
      }
    ],
    docs: [{ id: 'dev-guide', label: '开发指南', icon: 'FileText', type: 'doc' }],
    files: []
  }
];

// Mock 笔记数据
export const mockNotes: NavItem[] = [
  {
    id: 'my-notes',
    label: '我的笔记',
    icon: 'FileText',
    type: 'note',
    children: [
      { id: 'work-notes', label: '工作笔记', icon: 'Briefcase', type: 'note' },
      { id: 'meeting-minutes', label: '会议纪要', icon: 'Users', type: 'note' },
      { id: 'code-snippets', label: '代码片段', icon: 'Code', type: 'note' },
      { id: 'learning-notes', label: '学习笔记', icon: 'BookOpen', type: 'note' }
    ]
  },
  {
    id: 'favorites',
    label: '收藏',
    icon: 'Star',
    type: 'note',
    children: [
      { id: 'fav-article-1', label: '技术文章收藏', icon: 'FileText', type: 'note' },
      { id: 'fav-tutorial', label: '教程收藏', icon: 'BookOpen', type: 'note' }
    ]
  }
];

// Mock 文件数据
export const mockFiles: NavItem[] = [
  {
    id: 'all-files',
    label: '全部文件',
    icon: 'Folder',
    type: 'file',
    children: [
      {
        id: 'documents',
        label: '文档',
        icon: 'FileText',
        type: 'file',
        children: [
          { id: 'pdf-files', label: 'PDF文件', icon: 'FileText', type: 'file' },
          { id: 'word-files', label: 'Word文档', icon: 'FileText', type: 'file' }
        ]
      },
      {
        id: 'images',
        label: '图片',
        icon: 'Image',
        type: 'file',
        children: [
          { id: 'png-files', label: 'PNG图片', icon: 'Image', type: 'file' },
          { id: 'jpg-files', label: 'JPG图片', icon: 'Image', type: 'file' }
        ]
      },
      { id: 'videos', label: '视频', icon: 'Video', type: 'file' },
      { id: 'audio', label: '音频', icon: 'Headphones', type: 'file' },
      { id: 'archives', label: '压缩包', icon: 'Archive', type: 'file' }
    ]
  },
  {
    id: 'recent-files',
    label: '最近',
    icon: 'Clock',
    type: 'file',
    children: [
      { id: 'recent-doc-1', label: '项目文档.pdf', icon: 'FileText', type: 'file' },
      { id: 'recent-img-1', label: '截图.png', icon: 'Image', type: 'file' },
      { id: 'recent-video-1', label: '演示视频.mp4', icon: 'Video', type: 'file' }
    ]
  }
];

// 生成唯一 ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const useSidebarStore = create<SidebarState>((set, get) => ({
  activeItemId: 'claude-repo',
  expandedIds: new Set(['agent', 'my-notes', 'all-files']),
  spaces: mockSpaces,
  notes: mockNotes,
  files: mockFiles,
  setActiveItem: (id: string) => set({ activeItemId: id }),
  toggleExpand: (id: string) =>
    set((state) => {
      const newExpandedIds = new Set(state.expandedIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      return { expandedIds: newExpandedIds };
    }),
  isExpanded: (id: string) => get().expandedIds.has(id),

  // 工作空间管理
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
      spaces: state.spaces.filter((space) => space.id !== id),
      activeItemId: state.activeItemId === id ? null : state.activeItemId
    }));
  },

  // 笔记管理
  addNote: (note: Omit<NavItem, 'id'>, parentId?: string) => {
    set((state) => {
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
        return { notes: addToChildren(state.notes) };
      }
      return { notes: [...state.notes, { ...note, id: generateId() }] };
    });
  },

  updateNote: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => {
      const updateInTree = (items: NavItem[]): NavItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return { ...item, children: updateInTree(item.children) };
          }
          return item;
        });
      };
      return { notes: updateInTree(state.notes) };
    });
  },

  deleteNote: (id: string) => {
    set((state) => {
      const deleteFromTree = (items: NavItem[]): NavItem[] => {
        return items
          .filter((item) => item.id !== id)
          .map((item) => ({
            ...item,
            children: item.children ? deleteFromTree(item.children) : undefined
          }));
      };
      return {
        notes: deleteFromTree(state.notes),
        activeItemId: state.activeItemId === id ? null : state.activeItemId
      };
    });
  },

  // 文件管理
  addFile: (file: Omit<NavItem, 'id'>, parentId?: string) => {
    set((state) => {
      if (parentId) {
        const addToChildren = (items: NavItem[]): NavItem[] => {
          return items.map((item) => {
            if (item.id === parentId) {
              return {
                ...item,
                children: [...(item.children || []), { ...file, id: generateId() }]
              };
            }
            if (item.children) {
              return { ...item, children: addToChildren(item.children) };
            }
            return item;
          });
        };
        return { files: addToChildren(state.files) };
      }
      return { files: [...state.files, { ...file, id: generateId() }] };
    });
  },

  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => {
      const updateInTree = (items: NavItem[]): NavItem[] => {
        return items.map((item) => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return { ...item, children: updateInTree(item.children) };
          }
          return item;
        });
      };
      return { files: updateInTree(state.files) };
    });
  },

  deleteFile: (id: string) => {
    set((state) => {
      const deleteFromTree = (items: NavItem[]): NavItem[] => {
        return items
          .filter((item) => item.id !== id)
          .map((item) => ({
            ...item,
            children: item.children ? deleteFromTree(item.children) : undefined
          }));
      };
      return {
        files: deleteFromTree(state.files),
        activeItemId: state.activeItemId === id ? null : state.activeItemId
      };
    });
  }
}));
