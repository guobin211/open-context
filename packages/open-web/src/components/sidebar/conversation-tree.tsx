import { MoreVertical, Pencil, Trash, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../storage/sidebar-store';
import { useSidebarChatStore, type NavItem, type ConversationGroup } from '../../storage/sidebar-chat-store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InputDialog, ConfirmDialog } from './dialogs';
import { useInputDialog, useConfirmDialog } from '@/hooks/use-dialog';

export function ConversationTree() {
  const { conversationGroups } = useSidebarChatStore();
  const inputDialog = useInputDialog();
  const confirmDialog = useConfirmDialog();

  return (
    <>
      <div className="space-y-2">
        {conversationGroups.map((group) => (
          <ConversationGroupSection
            key={group.id}
            group={group}
            inputDialog={inputDialog}
            confirmDialog={confirmDialog}
          />
        ))}
      </div>
      <InputDialog {...inputDialog} />
      <ConfirmDialog {...confirmDialog} />
    </>
  );
}

interface ConversationGroupSectionProps {
  group: ConversationGroup;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function ConversationGroupSection({ group, inputDialog, confirmDialog }: ConversationGroupSectionProps) {
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
        <div className="mt-1 ml-2 space-y-0.5">
          {group.items.map((item) => (
            <ConversationItem key={item.id} item={item} inputDialog={inputDialog} confirmDialog={confirmDialog} />
          ))}
          {group.items.length === 0 && <div className="px-2 py-4 text-center text-xs text-gray-400">暂无会话</div>}
        </div>
      )}
    </div>
  );
}

interface ConversationItemProps {
  item: NavItem;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function ConversationItem({ item, inputDialog, confirmDialog }: ConversationItemProps) {
  const navigate = useNavigate();
  const { activeItemId, setActiveItem } = useSidebarStore();
  const { updateConversation, deleteConversation, toggleFavoriteConversation } = useSidebarChatStore();
  const isActive = activeItemId === item.id;

  const handleClick = () => {
    setActiveItem(item.id);
    void navigate({ to: '/chat/$id', params: { id: item.id } });
  };

  const handleEdit = async () => {
    const name = await inputDialog.show({
      title: '重命名会话',
      defaultValue: item.label
    });

    if (name && name !== item.label) {
      updateConversation(item.id, { label: name });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog.show({
      message: `确定要删除会话 "${item.label}" 吗？`
    });

    if (confirmed) {
      deleteConversation(item.id);
    }
  };

  const handleToggleFavorite = () => {
    toggleFavoriteConversation(item.id);
  };

  return (
    <div
      className={cn(
        'cursor group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-gray-100',
        isActive && 'bg-blue-50 hover:bg-blue-50'
      )}
      onClick={handleClick}
    >
      <span className={cn('flex-1 truncate', isActive && 'font-medium text-blue-600')}>{item.label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn('cursor opacity-0 transition-opacity group-hover:opacity-100', isActive && 'opacity-100')}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={handleToggleFavorite} className="cursor gap-2 text-sm">
            <Star className="h-4 w-4" />
            <span>收藏/取消</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit} className="cursor gap-2 text-sm">
            <Pencil className="h-4 w-4" />
            <span>重命名</span>
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
