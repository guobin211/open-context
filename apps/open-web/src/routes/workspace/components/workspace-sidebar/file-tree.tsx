import {
  ChevronRight,
  FileText,
  Folder,
  Clock,
  Image,
  Video,
  Music,
  Archive,
  File,
  Table,
  Presentation,
  FileCode,
  MoreVertical,
  Pencil,
  Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../../../storage/sidebar-store';
import { useFilesStore, type NavItem, type FileGroup, type FileCategory } from '../../../../storage/files-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Music,
  Archive,
  File,
  Table,
  Presentation,
  FileCode
};

export function FileTree() {
  const { fileGroups } = useFilesStore();
  const inputDialog = useInputDialog();
  const confirmDialog = useConfirmDialog();

  return (
    <>
      <div className="space-y-2">
        {fileGroups.map((group) => (
          <FileGroupSection key={group.id} group={group} inputDialog={inputDialog} confirmDialog={confirmDialog} />
        ))}
      </div>
      <InputDialog {...inputDialog} />
      <ConfirmDialog {...confirmDialog} />
    </>
  );
}

interface FileGroupSectionProps {
  group: FileGroup;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function FileGroupSection({ group, inputDialog, confirmDialog }: FileGroupSectionProps) {
  const { isExpanded, toggleExpand } = useSidebarStore();
  const expanded = isExpanded(group.id);

  return (
    <div>
      <div
        className="cursor flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        onClick={() => toggleExpand(group.id)}
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')} />
        <span className="flex-1 font-medium">{group.label}</span>
      </div>
      {expanded && (
        <div className="mt-1 ml-2 space-y-1">
          {group.categories && group.categories.length > 0
            ? group.categories.map((category) => (
                <FileCategorySection
                  key={category.id}
                  category={category}
                  inputDialog={inputDialog}
                  confirmDialog={confirmDialog}
                />
              ))
            : group.items.map((item) => (
                <FileItem key={item.id} item={item} inputDialog={inputDialog} confirmDialog={confirmDialog} />
              ))}
        </div>
      )}
    </div>
  );
}

interface FileCategorySectionProps {
  category: FileCategory;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function FileCategorySection({ category }: FileCategorySectionProps) {
  const Icon = iconMap[category.icon] || File;
  return (
    <div>
      <div className="cursor flex items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate text-gray-600">{category.label}</span>
      </div>
    </div>
  );
}

interface FileItemProps {
  item: NavItem;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function FileItem({ item, inputDialog, confirmDialog }: FileItemProps) {
  const { activeItemId, setActiveItem } = useSidebarStore();
  const { updateFile, deleteFile } = useFilesStore();
  const isActive = activeItemId === item.id;
  const Icon = iconMap[item.icon] || File;

  const handleEdit = async () => {
    const name = await inputDialog.show({
      title: '重命名文件',
      defaultValue: item.label
    });

    if (name && name !== item.label) {
      updateFile(item.id, { label: name });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog.show({
      message: `确定要删除文件 "${item.label}" 吗？`
    });

    if (confirmed) {
      deleteFile(item.id);
    }
  };

  return (
    <div
      className={cn(
        'group cursor flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50'
      )}
      onClick={() => setActiveItem(item.id)}
    >
      <div className="h-3 w-3 shrink-0" />
      <Icon className="h-4 w-4 shrink-0" />
      <span className={cn('flex-1 truncate', isActive && 'font-medium text-blue-600')}>{item.label}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn('opacity-0 transition-opacity group-hover:opacity-100', isActive && 'opacity-100')}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={handleEdit} className="gap-2 text-sm">
            <Pencil className="h-4 w-4" />
            <span>重命名</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="gap-2 text-sm text-red-600">
            <Trash className="h-4 w-4" />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
