import type { ChatSession, FileGroup, NoteGroup, Space } from './types';
import { v4 as uuidv4 } from 'uuid';

export const defaultSessionId = uuidv4();

export const mockSessions: ChatSession[] = [
  {
    id: defaultSessionId,
    title: '新会话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

export const mockNoteGroups: NoteGroup[] = [
  {
    id: 'my-notes',
    label: '我的笔记',
    icon: 'FileText',
    items: [
      { id: 'note-1', label: '工作笔记', isGroup: true, icon: 'Briefcase', type: 'note' },
      { id: 'note-2', label: '会议纪要', isGroup: true, icon: 'Users', type: 'note' },
      { id: 'note-3', label: '代码片段', isGroup: true, icon: 'Code', type: 'note' },
      { id: 'note-4', label: '学习笔记', isGroup: true, icon: 'BookOpen', type: 'note' }
    ]
  },
  {
    id: 'note-favorites',
    label: '收藏',
    icon: 'Star',
    items: [
      { id: 'note-fav-1', label: '技术文章收藏', icon: 'FileText', type: 'note' },
      { id: 'note-fav-2', label: '教程收藏', icon: 'BookOpen', type: 'note' }
    ]
  }
];

export const mockFileGroups: FileGroup[] = [
  {
    id: 'all-files',
    label: '全部文件',
    icon: 'Folder',
    categories: [
      {
        id: 'cat-documents',
        label: '文档',
        icon: 'FileText',
        items: [
          { id: 'file-doc-1', label: '项目需求文档.pdf', icon: 'FileText', type: 'file' },
          { id: 'file-doc-2', label: '技术方案.docx', icon: 'FileText', type: 'file' }
        ]
      },
      {
        id: 'cat-images',
        label: '图片',
        icon: 'Image',
        items: [
          { id: 'file-img-1', label: '架构图.png', icon: 'Image', type: 'file' },
          { id: 'file-img-2', label: '截图.jpg', icon: 'Image', type: 'file' }
        ]
      },
      {
        id: 'cat-videos',
        label: '视频',
        icon: 'Video',
        items: [{ id: 'file-vid-1', label: '演示视频.mp4', icon: 'Video', type: 'file' }]
      },
      {
        id: 'cat-audio',
        label: '音频',
        icon: 'Music',
        items: [{ id: 'file-aud-1', label: '会议录音.mp3', icon: 'Music', type: 'file' }]
      },
      {
        id: 'cat-other',
        label: '其他',
        icon: 'File',
        items: [{ id: 'file-other-1', label: 'data.zip', icon: 'Archive', type: 'file' }]
      }
    ],
    items: []
  },
  {
    id: 'recent-files',
    label: '最近',
    icon: 'Clock',
    items: [
      { id: 'recent-1', label: '项目文档.pdf', icon: 'FileText', type: 'file' },
      { id: 'recent-2', label: '截图.png', icon: 'Image', type: 'file' },
      { id: 'recent-3', label: '演示视频.mp4', icon: 'Video', type: 'file' }
    ]
  }
];

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
