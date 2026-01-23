import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../storage/sidebar-store';
import { useNotebookStore, type NavItem, type NoteGroup } from '../../storage/notebook-store';
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
  const expanded = isExpanded(group.id);

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

function NoteItem({ item }: NoteItemProps) {
  const { activeItemId, setActiveItem } = useSidebarStore();
  const isActive = activeItemId === item.id;

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
    </div>
  );
}
