import { ChevronRight, Box, FileText, Code, GitBranch, Folder, File, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, type Space, type SpaceResource } from '@/zustand/sidebar-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Box,
  FileText,
  Code,
  GitBranch,
  Folder,
  File
};

export function SpaceTree() {
  const { spaces } = useSidebarStore();

  return (
    <div className="space-y-1">
      {spaces.map((space) => (
        <SpaceItem key={space.id} space={space} />
      ))}
    </div>
  );
}

interface SpaceItemProps {
  space: Space;
}

function SpaceItem({ space }: SpaceItemProps) {
  const { isExpanded, toggleExpand } = useSidebarStore();
  const expanded = isExpanded(space.id);
  const Icon = iconMap[space.icon] || Box;

  const hasContent = space.repos.length > 0 || space.docs.length > 0 || space.files.length > 0;

  return (
    <Collapsible open={expanded} onOpenChange={() => toggleExpand(space.id)}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
            'text-gray-700 hover:bg-gray-100'
          )}
        >
          <ChevronRight
            className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
          />
          <Icon className="h-4 w-4 shrink-0" style={space.color ? { color: space.color } : undefined} />
          <span className="truncate">{space.label}</span>
        </button>
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

function ResourceGroup({ groupId, title, resources, addLabel }: ResourceGroupProps) {
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
            <ResourceItem key={resource.id} resource={resource} level={0} />
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
}

function ResourceItem({ resource, level }: ResourceItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand } = useSidebarStore();
  const isActive = activeItemId === resource.id;
  const hasChildren = resource.children && resource.children.length > 0;
  const expanded = isExpanded(resource.id);
  const Icon = iconMap[resource.icon] || File;

  // 根据类型设置不同的图标颜色
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
              <ResourceItem key={child.id} resource={child} level={level + 1} />
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
