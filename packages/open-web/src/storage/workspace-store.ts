import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

export type SpaceResourceType = 'repo' | 'doc' | 'file';

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

interface WorkspaceState {
  spaces: Space[];
  addSpace: (space: Omit<Space, 'id'>) => void;
  updateSpace: (id: string, updates: Partial<Omit<Space, 'id'>>) => void;
  deleteSpace: (id: string) => void;
}

const generateId = () => uuidv4();


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
