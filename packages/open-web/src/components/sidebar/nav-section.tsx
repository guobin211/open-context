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
import { useSidebarStore } from '@/zustand/sidebar-store';

type SectionType = 'note' | 'file' | 'space';

interface NavSectionProps {
  title: string;
  type: SectionType;
  children: ReactNode;
}

export function NavSection({ title, type, children }: NavSectionProps) {
  const inputDialog = useInputDialog();
  const { addNote, addFile, addSpace } = useSidebarStore();

  const handleAdd = async (actionType: string) => {
    const name = await inputDialog.show({
      title:
        actionType === 'note'
          ? '新建笔记'
          : actionType === 'folder-note'
            ? '新建笔记文件夹'
            : actionType === 'file'
              ? '上传文件'
              : actionType === 'folder-file'
                ? '新建文件文件夹'
                : '新建工作空间',
      defaultValue: ''
    });

    if (!name) return;

    switch (actionType) {
      case 'note':
        addNote({ label: name, icon: 'FileText', type: 'note' });
        break;
      case 'folder-note':
        addNote({ label: name, icon: 'Folder', type: 'note', children: [] });
        break;
      case 'file':
        addFile({ label: name, icon: 'File', type: 'file' });
        break;
      case 'folder-file':
        addFile({ label: name, icon: 'Folder', type: 'file', children: [] });
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
        <div className="group flex items-center justify-between px-3 pb-1">
          <span className="text-xs font-medium text-gray-500">{title}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-5 w-5 items-center justify-center rounded text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 hover:text-gray-600">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {type === 'note' && (
                <>
                  <DropdownMenuItem onClick={() => handleAdd('note')} className="gap-2 text-sm">
                    <FilePlus className="h-4 w-4" />
                    <span>新建笔记</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAdd('folder-note')} className="gap-2 text-sm">
                    <FolderPlus className="h-4 w-4" />
                    <span>新建文件夹</span>
                  </DropdownMenuItem>
                </>
              )}

              {type === 'file' && (
                <>
                  <DropdownMenuItem onClick={() => handleAdd('file')} className="gap-2 text-sm">
                    <FilePlus className="h-4 w-4" />
                    <span>上传文件</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAdd('folder-file')} className="gap-2 text-sm">
                    <FolderPlus className="h-4 w-4" />
                    <span>新建文件夹</span>
                  </DropdownMenuItem>
                </>
              )}

              {type === 'space' && (
                <DropdownMenuItem onClick={() => handleAdd('space')} className="gap-2 text-sm">
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
