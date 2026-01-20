import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

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

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  type: 'note' | 'file' | 'space' | 'conversation';
  children?: NavItem[];
  color?: string;
}

interface FilesStore {
  fileGroups: FileGroup[];
  addFile: (file: Omit<NavItem, 'id'>, groupId?: string, categoryId?: string) => void;
  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => void;
  deleteFile: (id: string) => void;
  addToRecentFiles: (file: Omit<NavItem, 'id'>) => void;
}

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

const generateId = () => uuidv4();

export const useFilesStore = create<FilesStore>((set) => ({
  fileGroups: mockFileGroups,

  addFile: (file: Omit<NavItem, 'id'>, groupId: string = 'all-files', categoryId?: string) => {
    set((state) => {
      return {
        fileGroups: state.fileGroups.map((group) => {
          if (group.id === groupId) {
            if (categoryId && group.categories) {
              return {
                ...group,
                categories: group.categories.map((category) =>
                  category.id === categoryId
                    ? { ...category, items: [...category.items, { ...file, id: generateId() }] }
                    : category
                )
              };
            }
            return { ...group, items: [...group.items, { ...file, id: generateId() }] };
          }
          return group;
        })
      };
    });
  },

  updateFile: (id: string, updates: Partial<Omit<NavItem, 'id'>>) => {
    set((state) => {
      return {
        fileGroups: state.fileGroups.map((group) => {
          const updatedCategories = group.categories?.map((category) => ({
            ...category,
            items: category.items.map((item) => (item.id === id ? { ...item, ...updates } : item))
          }));

          const updatedItems = group.items.map((item) => (item.id === id ? { ...item, ...updates } : item));

          return {
            ...group,
            categories: updatedCategories,
            items: updatedItems
          };
        })
      };
    });
  },

  deleteFile: (id: string) => {
    set((state) => {
      return {
        fileGroups: state.fileGroups.map((group) => {
          const updatedCategories = group.categories?.map((category) => ({
            ...category,
            items: category.items.filter((item) => item.id !== id)
          }));

          const updatedItems = group.items.filter((item) => item.id !== id);

          return {
            ...group,
            categories: updatedCategories,
            items: updatedItems
          };
        })
      };
    });
  },

  addToRecentFiles: (file: Omit<NavItem, 'id'>) => {
    set((state) => {
      return {
        fileGroups: state.fileGroups.map((group) => {
          if (group.id === 'recent-files') {
            const newFile = { ...file, id: generateId() };
            const filteredItems = group.items.filter((item) => item.label !== file.label);
            const updatedItems = [newFile, ...filteredItems].slice(0, 5);

            return { ...group, items: updatedItems };
          }
          return group;
        })
      };
    });
  }
}));
