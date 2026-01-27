import { FileText, Star, Folder, Clock, Box, Code, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '../../../../storage/sidebar-store';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  FileText,
  Star,
  Folder,
  Clock,
  Box,
  Code
};

interface NavItemProps {
  id: string;
  label: string;
  icon: string;
  color?: string;
  level?: number;
  hasChildren?: boolean;
}

export function NavItem({ id, label, icon, color, level = 0, hasChildren = false }: NavItemProps) {
  const { activeItemId, setActiveItem, isExpanded, toggleExpand } = useSidebarStore();
  const isActive = activeItemId === id;
  const isExpandedItem = isExpanded(id);
  const Icon = iconMap[icon] || FileText;

  const handleClick = () => {
    if (hasChildren) {
      toggleExpand(id);
    }
    setActiveItem(id);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
          isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {hasChildren && (
          <ChevronRight className={cn('h-3 w-3 shrink-0 transition-transform', isExpandedItem && 'rotate-90')} />
        )}
        <Icon className="h-4 w-4 shrink-0" style={color ? { color } : undefined} />
        <span className="truncate">{label}</span>
      </button>
    </div>
  );
}
