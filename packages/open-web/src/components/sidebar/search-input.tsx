import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchInput() {
  return (
    <div className="px-3 pb-3">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input type="text" placeholder="搜索..." className="h-9 border-gray-200 bg-white pr-12 pl-9 text-sm" />
        <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
