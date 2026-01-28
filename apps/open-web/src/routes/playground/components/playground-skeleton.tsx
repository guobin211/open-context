import { cn } from '@/lib/utils';

interface PlaygroundSkeletonProps {
  className?: string;
  lines?: number;
}

export const PlaygroundSkeleton = ({ className, lines = 5 }: PlaygroundSkeletonProps) => {
  return (
    <div className={cn('flex h-full flex-col gap-3 p-4', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-3" style={{ animationDelay: `${i * 0.1}s` }}>
          <SkeletonBox className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

interface SkeletonBoxProps {
  className?: string;
}

const SkeletonBox = ({ className }: SkeletonBoxProps) => {
  return <div className={cn('bg-muted animate-pulse rounded', className)} />;
};
