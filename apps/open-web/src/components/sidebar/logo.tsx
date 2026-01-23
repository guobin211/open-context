import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

export interface LogoProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Logo: React.FC<LogoProps> = ({ className, style }) => (
  <div data-tauri-drag-region className={cn('flex items-center gap-2 px-3 pt-8 pb-4', className)} style={style}>
    <div
      data-tauri-drag-region
      className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-red-500 to-orange-500"
    >
      <Zap data-tauri-drag-region className="h-5 w-5 text-white" />
    </div>
    <span className="text-base font-semibold text-gray-900">OpenContext</span>
  </div>
);
