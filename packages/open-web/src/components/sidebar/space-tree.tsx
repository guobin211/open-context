import {
  ChevronRight,
  Box,
  FileText,
  Code,
  GitBranch,
  Folder,
  File,
  Plus,
  MoreVertical,
  Pencil,
  Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, type Space, type SpaceResource } from '@/zustand/sidebar-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { InputDialog, ConfirmDialog } from './dialogs';
import { useInputDialog, useConfirmDialog } from '@/hooks/use-dialog';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Box,
  FileText,
  Code,
  GitBranch,
  Folder,
  File
};

export function SpaceTree() {
  const { spaces, addSpace } = useSidebarStore();
  const inputDialog = useInputDialog();
  const confirmDialog = useConfirmDialog();

  const handleAddSpace = async () => {
    const name = await inputDialog.show({
      title: '新建工作空间',
      defaultValue: ''
    });

    if (name) {
      addSpace({
        label: name,
        icon: 'Box',
        color: '#3B82F6',
        repos: [],
        docs: [],
        files: []
      });
    }
  };

  return (
    <>
      <div className="space-y-1">
        {spaces.map((space) => (
          <SpaceItem key={space.id} space={space} inputDialog={inputDialog} confirmDialog={confirmDialog} />
        ))}
        <button
          onClick={handleAddSpace}
          className="flex w-full items-center justify-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <Plus className="h-4 w-4" />
          <span>添加工作空间</span>
        </button>
      </div>
      <InputDialog {...inputDialog} />
      <ConfirmDialog {...confirmDialog} />
    </>
  );
}

interface SpaceItemProps {
  space: Space;
  inputDialog: ReturnType<typeof useInputDialog>;
  confirmDialog: ReturnType<typeof useConfirmDialog>;
}

function SpaceItem({ space, inputDialog, confirmDialog }: SpaceItemProps) {
  const { isExpanded, toggleExpand, updateSpace, deleteSpace, activeItemId } = useSidebarStore();
  const expanded = isExpanded(space.id);
  const isActive = activeItemId === space.id;
  const Icon = iconMap[space.icon] || Box;

  const hasContent = space.repos.length > 0 || space.docs.length > 0 || space.files.length > 0;

  const handleEdit = async () => {
    const name = await inputDialog.show({
      title: '编辑工作空间名称',
      defaultValue: space.label
    });

    if (name && name !== space.label) {
      updateSpace(space.id, { label: name });
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog.show({
      message: `确定要删除工作空间 "${space.label}" 吗？此操作将删除该空间下的所有内容。`
    });

    if (confirmed) {
      deleteSpace(space.id);
    }
  };

  return (
    <Collapsible open={expanded} onOpenChange={() => toggleExpand(space.id)}>
      <CollapsibleTrigger asChild>
        <div
          className={cn(
            'group flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
            isActive && 'bg-blue-50'
          )}
        >
          <ChevronRight
            className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
          />
          <Icon className="h-4 w-4 shrink-0" style={space.color ? { color: space.color } : undefined} />
          <span className={cn('flex-1 truncate', isActive && 'font-medium text-blue-600')}>{space.label}</span>

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
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {hasContent && (
          <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-2">
            {/* Git 仓库分组 */}
            {space.repos.length > 0 && (
              <ResourceGroup
                spaceId={space.id}
                groupId={`${space.id}-repos`}
                title="仓库"
                resources={space.repos}
                addLabel="导入仓库"
              />
            )}

            {/* 文档分组 */}
            {space.docs.length > 0 && (
              <ResourceGroup
                spaceId={space.id}
                groupId={`${space.id}-docs`}
                title="文档"
                resources={space.docs}
                addLabel="添加文档"
              />
            )}

            {/* 文件分组 */}
            {space.files.length > 0 && (
              <ResourceGroup
                spaceId={space.id}
                groupId={`${space.id}-files`}
                title="文件"
                resources={space.files}
                addLabel="上传文件"
              />
            )}

            {/* 空状态时显示添加按钮 */}
            {!hasContent && (
              <div className="py-2 text-center text-xs text-gray-400">
                <button className="flex w-full items-center justify-center gap-1 rounded px-2 py-1 hover:bg-gray-100">
                  <Plus className="h-3 w-3" />
                  <span>添加内容</span>
                </button>
              </div>
            )}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ResourceGroupProps {
  spaceId: string;
  groupId: string;
  title: string;
  resources: SpaceResource[];
  addLabel: string;
}

function ResourceGroup({ groupId, title, resources, addLabel, spaceId }: ResourceGroupProps) {
  const { isExpanded, toggleExpand } = useSidebarStore();
  const expanded = isExpanded(groupId);

  return (
    <Collapsible open={expanded} onOpenChange={() => toggleExpand(groupId)}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center gap-1 rounded px-1 py-1 text-xs text-gray-500 hover:bg-gray-100">
          <ChevronRight className={cn('h-3 w-3 shrink-0 transition-transform', expanded && 'rotate-90')} />
          <span>{title}</span>
          <span className="ml-auto text-gray-400">{resources.length}</span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 py-0.5">
          {resources.map((resource) => (
            <ResourceItem key={resource.id} resource={resource} spaceId={spaceId} level={0} />
          ))}
          <button className="flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Plus className="h-3 w-3" />
            <span>{addLabel}</span>
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface ResourceItemProps {
  resource: SpaceResource;
  level: number;
  spaceId: string;
}

function ResourceItem({ resource, level, spaceId }: ResourceItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand } = useSidebarStore();
  const isActive = activeItemId === resource.id;
  const hasChildren = resource.children && resource.children.length > 0;
  const expanded = isExpanded(resource.id);
  const Icon = iconMap[resource.icon] || File;

  const iconColor = resource.type === 'repo' ? '#F59E0B' : resource.type === 'doc' ? '#3B82F6' : undefined;

  if (hasChildren) {
    return (
      <Collapsible open={expanded} onOpenChange={() => toggleExpand(resource.id)}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-1 rounded px-1 py-1 text-sm transition-colors',
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            )}
            style={{ paddingLeft: `${4 + level * 12}px` }}
          >
            <ChevronRight
              className={cn('h-3 w-3 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
            />
            <Icon className="h-4 w-4 shrink-0" style={iconColor ? { color: iconColor } : undefined} />
            <span className="truncate text-xs">{resource.label}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0.5">
            {resource.children?.map((child) => (
              <ResourceItem key={child.id} resource={child} spaceId={spaceId} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <button
      onClick={() => setActiveItem(resource.id)}
      className={cn(
        'flex w-full items-center gap-1 rounded px-1 py-1 text-sm transition-colors',
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
      )}
      style={{ paddingLeft: `${16 + level * 12}px` }}
    >
      <Icon className="h-4 w-4 shrink-0" style={iconColor ? { color: iconColor } : undefined} />
      <span className="truncate text-xs">{resource.label}</span>
    </button>
  );
}
