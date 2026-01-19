import {
  ChevronRight,
  FileText,
  Folder,
  Clock,
  Image,
  Video,
  Headphones,
  Archive,
  File,
  MoreVertical,
  Pencil,
  Trash,
  FilePlus,
  FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, type NavItem } from '@/zustand/sidebar-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InputDialog, ConfirmDialog } from './dialogs';
import { useInputDialog, useConfirmDialog } from '@/hooks/use-dialog';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Folder,
  Clock,
  Image,
  Video,
  Headphones,
  Archive,
  File
};

export function FileTree() {
  const { files } = useSidebarStore();
  const inputDialog = useInputDialog();
  const confirmDialog = useConfirmDialog();

  return (
    <>
      <div className="space-y-0.5">
        {files.map((item) => (
          <FileItem key={item.id} item={item} level={0} inputDialog={inputDialog} confirmDialog={confirmDialog} />
        ))}
      </div>
      <InputDialog {...inputDialog} />
      <ConfirmDialog {...confirmDialog} />
    </>
  );
}

interface FileItemProps {
  item: NavItem;
  level: number;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function FileItem({ item, level, inputDialog, confirmDialog }: FileItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand, addFile, updateFile, deleteFile } = useSidebarStore();
  const isActive = activeItemId === item.id;
  const hasChildren = item.children && item.children.length > 0;
  const expanded = isExpanded(item.id);
  const Icon = iconMap[item.icon] || File;

  const handleAdd = async (type: string) => {
    const name = await inputDialog.show({
      title: type === 'file' ? '上传文件' : '新建文件夹',
      defaultValue: ''
    });

    if (name) {
      if (type === 'file') {
        addFile({ label: name, icon: 'File', type: 'file' }, item.id);
      } else if (type === 'folder') {
        addFile({ label: name, icon: 'Folder', type: 'file', children: [] }, item.id);
      }
    }
  };

  const handleEdit = async () => {
    const name = await inputDialog.show({
      title: '编辑名称',
      defaultValue: item.label
    });

    if (name && name !== item.label) {
      updateFile(item.id, { label: name });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog.show({
      message: `确定要删除 "${item.label}" 吗？`
    });

    if (confirmed) {
      deleteFile(item.id);
    }
  };

  if (hasChildren) {
    return (
      <Collapsible open={expanded} onOpenChange={() => toggleExpand(item.id)}>
        <CollapsibleTrigger asChild>
          <div className="group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100">
            <ChevronRight
              className={cn('h-3 w-3 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
            />
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>

            {
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => handleAdd('file')} className="gap-2 text-sm">
                    <FilePlus className="h-4 w-4" />
                    <span>上传文件</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAdd('folder')} className="gap-2 text-sm">
                    <FolderPlus className="h-4 w-4" />
                    <span>新建文件夹</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEdit} className="gap-2 text-sm">
                    <Pencil className="h-4 w-4" />
                    <span>编辑</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="gap-2 text-sm text-red-600">
                    <Trash className="h-4 w-4" />
                    <span>删除</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0.5">
            {item.children?.map((child) => (
              <FileItem
                key={child.id}
                item={child}
                level={level + 1}
                inputDialog={inputDialog}
                confirmDialog={confirmDialog}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div
      className={cn(
        'group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive && 'bg-blue-50'
      )}
    >
      <div className="h-3 w-3 shrink-0" />
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={cn('flex-1 truncate', isActive && 'font-medium text-blue-600')}
        onClick={() => setActiveItem(item.id)}
      >
        {item.label}
      </span>

      {
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={handleEdit} className="gap-2 text-sm">
              <Pencil className="h-4 w-4" />
              <span>编辑</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="gap-2 text-sm text-red-600">
              <Trash className="h-4 w-4" />
              <span>删除</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      }
    </div>
  );
}
