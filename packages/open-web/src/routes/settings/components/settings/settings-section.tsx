import { cn } from '../../../../lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const SettingsSection = ({ title, description, children, className }: SettingsSectionProps) => {
  return (
    <div className={cn('mb-8 space-y-4', className)}>
      <div className="pb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      <div className="space-y-0 border-t border-gray-200">{children}</div>
    </div>
  );
};
