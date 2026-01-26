import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaygroundLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlaygroundLoading = ({ className, size = 'md' }: PlaygroundLoadingProps) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn('flex h-full items-center justify-center', className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('text-primary animate-spin', sizeClasses[size])} />
        <p className="text-muted-foreground text-sm">{t('playground.loading')}</p>
      </div>
    </div>
  );
};
