import { cn } from '../../../lib/utils';

interface SettingsItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsItem = ({ label, description, children, className }: SettingsItemProps) => {
  return (
    <div className={cn('flex items-start justify-between py-4', className)}>
      <div className="flex flex-1 flex-col gap-1 pr-4">
        <label className="text-sm font-medium text-gray-900">{label}</label>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
};
