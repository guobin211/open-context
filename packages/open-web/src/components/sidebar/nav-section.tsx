import type { ReactNode } from 'react';
import { MoreHorizontal, FolderPlus, FilePlus, Box } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InputDialog } from './dialogs';
import { useInputDialog } from '@/hooks/use-dialog';
import { useNotebookStore } from '../../storage/notebook-store';
import { useFilesStore } from '../../storage/files-store';
import { useWorkspaceStore } from '../../storage/workspace-store';
import { useSidebarChatStore } from '../../storage/sidebar-chat-store';

type SectionType = 'chat' | 'note' | 'file' | 'space';

interface NavSectionProps {
  title: string;
  type: SectionType;
  children: ReactNode;
}

export function NavSection({ title, type, children }: NavSectionProps) {
  const inputDialog = useInputDialog();
  const { addNote } = useNotebookStore();
  const { addFile } = useFilesStore();
  const { addSpace } = useWorkspaceStore();
  const { addConversation } = useSidebarChatStore();

  const handleAdd = async (actionType: string) => {
    const name = await inputDialog.show({
      title:
        actionType === 'conversation'
          ? '新建会话'
          : actionType === 'note'
            ? '新建笔记'
            : actionType === 'folder-note'
              ? '新建笔记文件夹'
              : actionType === 'file'
                ? '上传文件'
                : '新建工作空间',
      defaultValue: ''
    });

    if (!name) return;

    switch (actionType) {
      case 'conversation':
        addConversation({ label: name, icon: 'MessageSquare', type: 'conversation' });
        break;
      case 'note':
        addNote({ label: name, icon: 'FileText', type: 'note' });
        break;
      case 'folder-note':
        addNote({ label: name, icon: 'Folder', type: 'note', children: [] });
        break;
      case 'file':
        addFile({ label: name, icon: 'File', type: 'file' });
        break;
      case 'space':
        addSpace({
          label: name,
          icon: 'Box',
          color: '#3B82F6',
          repos: [],
          docs: [],
          files: []
        });
        break;
    }
  };

  return (
    <>
      <div className="py-2">
        <div className="cursor group flex items-center justify-between px-3 pb-1">
          <span className="cursor text-xs font-medium text-gray-500">{title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="cursor flex h-5 w-5 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {type === 'chat' && (
                <DropdownMenuItem onClick={() => handleAdd('conversation')} className="cursor gap-2 text-sm">
                  <FilePlus className="h-4 w-4" />
                  <span>新建会话</span>
                </DropdownMenuItem>
              )}

              {type === 'note' && (
                <>
                  <DropdownMenuItem onClick={() => handleAdd('note')} className="cursor gap-2 text-sm">
                    <FilePlus className="h-4 w-4" />
                    <span>新建笔记</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAdd('folder-note')} className="cursor gap-2 text-sm">
                    <FolderPlus className="h-4 w-4" />
                    <span>新建文件夹</span>
                  </DropdownMenuItem>
                </>
              )}

              {type === 'file' && (
                <DropdownMenuItem onClick={() => handleAdd('file')} className="cursor gap-2 text-sm">
                  <FilePlus className="h-4 w-4" />
                  <span>导入文件</span>
                </DropdownMenuItem>
              )}

              {type === 'space' && (
                <DropdownMenuItem onClick={() => handleAdd('space')} className="cursor gap-2 text-sm">
                  <Box className="h-4 w-4" />
                  <span>新建空间</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-0.5">{children}</div>
      </div>
      <InputDialog {...inputDialog} />
    </>
  );
}
