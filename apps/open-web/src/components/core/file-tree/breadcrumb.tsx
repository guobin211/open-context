import React from 'react';
import path from 'path-browserify';
import { ChevronRight, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPath, onNavigate, className }) => {
  const segments = React.useMemo(() => {
    const parts = currentPath.split(path.sep).filter(Boolean);
    const result: Array<{ name: string; fullPath: string }> = [];

    let accumulatedPath = '';
    parts.forEach((part, index) => {
      accumulatedPath = index === 0 ? part : path.join(accumulatedPath, part);
      result.push({
        name: part,
        fullPath: accumulatedPath
      });
    });

    return result;
  }, [currentPath]);

  return (
    <div
      className={cn(
        'flex items-center gap-1 overflow-x-auto px-2 py-1.5 text-sm',
        'border-border bg-background/50 border-b',
        className
      )}
    >
      <Folder className="text-muted-foreground h-4 w-4 shrink-0" />

      {segments.map((segment, index) => (
        <React.Fragment key={segment.fullPath}>
          {index > 0 && <ChevronRight className="text-muted-foreground h-3 w-3 shrink-0" />}
          <button
            onClick={() => onNavigate?.(segment.fullPath)}
            className={cn(
              'hover:text-foreground whitespace-nowrap transition-colors',
              index === segments.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
