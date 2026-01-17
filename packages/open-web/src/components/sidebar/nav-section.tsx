import type { ReactNode } from 'react';
import { MoreHorizontal, FolderPlus, FilePlus, Box } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

type SectionType = 'note' | 'file' | 'space';

interface NavSectionProps {
  title: string;
  type: SectionType;
  children: ReactNode;
  onAdd?: () => void;
}

const sectionActions: Record<SectionType, { icon: React.ComponentType<{ className?: string }>; label: string }[]> = {
  note: [
    { icon: FilePlus, label: '新建笔记' },
    { icon: FolderPlus, label: '新建文件夹' }
  ],
  file: [
    { icon: FilePlus, label: '上传文件' },
    { icon: FolderPlus, label: '新建文件夹' }
  ],
  space: [{ icon: Box, label: '新建空间' }]
};

export function NavSection({ title, type, children }: NavSectionProps) {
  const actions = sectionActions[type];

  return (
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
            {actions.map((action) => (
              <DropdownMenuItem key={action.label} className="gap-2 text-sm">
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
