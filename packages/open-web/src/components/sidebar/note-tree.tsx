import { ChevronRight, FileText, Star, Folder, Briefcase, Users, Code, BookOpen, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore, type NavItem } from '@/zustand/sidebar-store';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Star,
  Folder,
  Briefcase,
  Users,
  Code,
  BookOpen,
  Box
};

export function NoteTree() {
  const { notes } = useSidebarStore();

  return (
    <div className="space-y-0.5">
      {notes.map((item) => (
        <NoteItem key={item.id} item={item} level={0} />
      ))}
    </div>
  );
}

interface NoteItemProps {
  item: NavItem;
  level: number;
}

function NoteItem({ item, level }: NoteItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand } = useSidebarStore();
  const isActive = activeItemId === item.id;
  const hasChildren = item.children && item.children.length > 0;
  const expanded = isExpanded(item.id);
  const Icon = iconMap[item.icon] || FileText;

  if (hasChildren) {
    return (
      <Collapsible open={expanded} onOpenChange={() => toggleExpand(item.id)}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
              isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            )}
            style={{ paddingLeft: `${8 + level * 12}px` }}
          >
            <ChevronRight
              className={cn('h-3 w-3 shrink-0 text-gray-400 transition-transform', expanded && 'rotate-90')}
            />
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-0.5">
            {item.children?.map((child) => (
              <NoteItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <button
      onClick={() => setActiveItem(item.id)}
      className={cn(
        'flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors',
        isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
      )}
      style={{ paddingLeft: `${20 + level * 12}px` }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </button>
  );
}
