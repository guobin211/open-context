import { cn } from '@/lib/utils';
import { type Tab, useTabsStore } from '@/storage';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, File, FileText, MessageSquare, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { HEADER_HEIGHT } from './constants';

const getTabIcon = (type: Tab['type']) => {
  switch (type) {
    case 'chat':
      return MessageSquare;
    case 'note':
      return FileText;
    case 'file':
      return File;
    default:
      return File;
  }
};

const getTabRoute = (tab: Tab) => {
  switch (tab.type) {
    case 'chat':
      return `/chat/${tab.id}`;
    case 'note':
      return `/note/${tab.id}`;
    case 'file':
      return `/file/${tab.id}`;
    default:
      return '/';
  }
};

export const EditorTabs = () => {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabsStore();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && tabsRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const tabsWidth = tabsRef.current.scrollWidth;
        setHasOverflow(tabsWidth > containerWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [tabs]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab.id);
    navigate({ to: getTabRoute(tab) }).catch(console.error);
    setDropdownOpen(false);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    removeTab(tabId);

    if (activeTabId === tabId && tabs.length > 1) {
      const newActiveTab = tabs[Math.max(0, tabIndex - 1)];
      if (newActiveTab && newActiveTab.id !== tabId) {
        navigate({ to: getTabRoute(newActiveTab) }).catch(console.error);
      } else if (tabs[tabIndex + 1]) {
        navigate({ to: getTabRoute(tabs[tabIndex + 1]) }).catch(console.error);
      }
    }
  };

  if (tabs.length === 0) {
    return <div className={`${HEADER_HEIGHT} border-b border-gray-200 bg-[#F7F7F5]`} />;
  }

  return (
    <div className={`flex ${HEADER_HEIGHT} items-center border-b border-gray-200 bg-[#F7F7F5]`}>
      <div ref={containerRef} className="relative flex h-full min-w-0 flex-1 items-end overflow-hidden">
        <div ref={tabsRef} className="flex h-full items-end">
          {tabs.map((tab) => {
            const Icon = getTabIcon(tab.type);
            const isActive = tab.id === activeTabId;

            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  'group flex h-full cursor-pointer items-center gap-1.5 border-r border-gray-200 px-3 transition-colors',
                  isActive ? 'bg-white' : 'bg-[#ECECEA] hover:bg-[#E5E5E3]'
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                <span className="max-w-30 truncate text-xs text-gray-700">{tab.label}</span>
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className={cn(
                    'ml-1 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600',
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 下拉按钮 */}
      <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex h-full w-8 shrink-0 items-center justify-center border-l border-gray-200 text-gray-500 transition-colors hover:bg-gray-100',
              hasOverflow && 'text-gray-700'
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-64 p-1">
          <div className="max-h-80 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = getTabIcon(tab.type);
              const isActive = tab.id === activeTabId;

              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-gray-100',
                    isActive && 'bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 text-gray-500" />
                  <span className="flex-1 truncate text-gray-700">{tab.label}</span>
                  <button
                    onClick={(e) => handleCloseTab(e, tab.id)}
                    className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
