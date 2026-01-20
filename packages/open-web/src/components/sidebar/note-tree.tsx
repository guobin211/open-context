import { ChevronRight, MoreVertical, Pencil, Trash, Star, FilePlus, FolderPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../storage/sidebar-store';
import { useNotebookStore, type NavItem, type NoteGroup } from '../../storage/notebook-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InputDialog, ConfirmDialog } from './dialogs';
import { useInputDialog, useConfirmDialog } from '@/hooks/use-dialog';

export function NoteTree() {
  const { noteGroups } = useNotebookStore();
  const inputDialog = useInputDialog();
  const confirmDialog = useConfirmDialog();

  return (
    <>
      <div className="space-y-2">
        {noteGroups.map((group) => (
          <NoteGroupSection key={group.id} group={group} inputDialog={inputDialog} confirmDialog={confirmDialog} />
        ))}
      </div>
      <InputDialog {...inputDialog} />
      <ConfirmDialog {...confirmDialog} />
    </>
  );
}

interface NoteGroupSectionProps {
  group: NoteGroup;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function NoteGroupSection({ group, inputDialog, confirmDialog }: NoteGroupSectionProps) {
  const { isExpanded, toggleExpand } = useSidebarStore();
  const { addNote } = useNotebookStore();
  const expanded = isExpanded(group.id);
  const isMyNotes = group.id === 'my-notes';

  const handleAdd = async (type: 'note' | 'folder') => {
    const name = await inputDialog.show({
      title: type === 'note' ? '新建笔记' : '新建文件夹',
      defaultValue: ''
    });

    if (name) {
      if (type === 'note') {
        addNote({ label: name, icon: 'FileText', type: 'note' }, group.id);
      } else if (type === 'folder') {
        addNote({ label: name, icon: 'Folder', type: 'note', children: [] }, group.id);
      }
    }
  };

  const handleGroupClick = () => {
    toggleExpand(group.id);
  };

  return (
    <div>
      <div
        className="group cursor flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        onClick={handleGroupClick}
      >
        <ChevronRight className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')} />
        <span className="flex-1 font-medium">{group.label}</span>

        {isMyNotes && (
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
              <DropdownMenuItem onClick={() => handleAdd('note')} className="gap-2 text-sm">
                <FilePlus className="h-4 w-4" />
                <span>新建笔记</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAdd('folder')} className="gap-2 text-sm">
                <FolderPlus className="h-4 w-4" />
                <span>新建文件夹</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {expanded && (
        <div className="mt-1 ml-2 space-y-0.5">
          {group.items.map((item) => (
            <NoteItem
              key={item.id}
              item={item}
              level={0}
              groupId={group.id}
              inputDialog={inputDialog}
              confirmDialog={confirmDialog}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface NoteItemProps {
  item: NavItem;
  level: number;
  groupId: string;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function NoteItem({ item, level, inputDialog, confirmDialog }: NoteItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand } = useSidebarStore();
  const { addNote, updateNote, deleteNote, toggleFavoriteNote } = useNotebookStore();
  const isActive = activeItemId === item.id;
  const hasChildren = item.children && item.children.length > 0;
  const expanded = isExpanded(item.id);

  const handleAdd = async (type: string, groupId?: string) => {
    const name = await inputDialog.show({
      title: type === 'note' ? '新建笔记' : '新建文件夹',
      defaultValue: ''
    });

    if (name) {
      if (type === 'note') {
        addNote({ label: name, icon: 'FileText', type: 'note' }, groupId, item.id);
      } else if (type === 'folder') {
        addNote({ label: name, icon: 'Folder', type: 'note', children: [] }, groupId, item.id);
      }
    }
  };

  const handleEdit = async () => {
    const name = await inputDialog.show({
      title: '编辑名称',
      defaultValue: item.label
    });

    if (name && name !== item.label) {
      updateNote(item.id, { label: name });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog.show({
      message: `确定要删除 "${item.label}" 吗？`
    });

    if (confirmed) {
      deleteNote(item.id);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavoriteNote(item.id);
  };

  if (hasChildren) {
    return (
      <Collapsible open={expanded} onOpenChange={() => toggleExpand(item.id)}>
        <CollapsibleTrigger asChild>
          <div className="cursor group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100">
            <ChevronRight
              className={cn('cursor h-3 w-3 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
            />
            <span className="cursor flex-1 truncate">{item.label}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="cursor opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="cursor h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleAdd('note')} className="cursor gap-2 text-sm">
                  <FilePlus className="h-4 w-4" />
                  <span>新建笔记</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleFavorite} className="cursor gap-2 text-sm">
                  <Star className="h-4 w-4" />
                  <span>收藏/取消</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit} className="cursor gap-2 text-sm">
                  <Pencil className="h-4 w-4" />
                  <span>编辑</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="cursor gap-2 text-sm text-red-600">
                  <Trash className="h-4 w-4" />
                  <span>删除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0.5">
            {item.children?.map((child) => (
              <NoteItem
                key={child.id}
                item={child}
                level={level + 1}
                groupId={item.id}
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
        'cursor group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive && 'bg-blue-50'
      )}
    >
      <div className="h-3 w-3 shrink-0" />
      <span
        className={cn('flex-1 truncate', isActive && 'font-medium text-blue-600')}
        onClick={() => setActiveItem(item.id)}
      >
        {item.label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="cursor opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="cursor h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={handleToggleFavorite} className="cursor gap-2 text-sm">
            <Star className="h-4 w-4" />
            <span>收藏/取消</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} className="cursor gap-2 text-sm">
            <Pencil className="h-4 w-4" />
            <span>编辑</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="cursor gap-2 text-sm text-red-600">
            <Trash className="h-4 w-4" />
            <span>删除</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
