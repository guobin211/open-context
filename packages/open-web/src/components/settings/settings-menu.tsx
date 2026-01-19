import type { SettingsMenuItem } from '../../types/settings.types';
import { Settings as SettingsIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SettingsMenuProps {
  items: SettingsMenuItem[];
  activeCategory: string | null;
  onItemClick: (category: string) => void;
}

const SettingsMenu = ({ items, activeCategory, onItemClick }: SettingsMenuProps) => {
  return (
    <div className="w-56 border-r border-gray-200 bg-gray-50">
      <div className="p-3">
        <h2 className="mb-3 text-sm font-semibold text-gray-500">设置</h2>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = activeCategory === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={cn(
                  'gap-3x5 flex w-full items-center rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                  isActive ? 'bg-blue-50 font-medium text-blue-600' : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <SettingsIcon className="h-5 w-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export { SettingsMenu };
