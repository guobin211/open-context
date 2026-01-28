import React, { useState, useRef, useEffect } from 'react';
import { FileTreeService } from '@/services';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, File, Folder, ChevronRight, FilterX } from 'lucide-react';
import { cn } from '@/lib/utils';
import path from 'path-browserify';

interface FileSearchProps {
  service: FileTreeService;
  onSelectResult?: (filePath: string) => void;
  className?: string;
}

interface SearchResult {
  path: string;
  name: string;
  directory: string;
  isDirectory: boolean;
}

export const FileSearch: React.FC<FileSearchProps> = ({ service, onSelectResult, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number | undefined>(undefined);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const paths = await service.search(searchQuery, caseSensitive);
      const searchResults: SearchResult[] = paths.map((filePath) => ({
        path: filePath,
        name: path.basename(filePath),
        directory: path.dirname(filePath),
        isDirectory: false
      }));

      setResults(searchResults);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim()) {
      searchTimeoutRef.current = window.setTimeout(() => {
        performSearch(query).catch(console.error);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, caseSensitive]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (query) {
        setQuery('');
      } else {
        setIsOpen(false);
      }
      return;
    }

    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelectResult?.(result.path);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const toggleCaseSensitive = () => {
    setCaseSensitive((prev) => !prev);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex w-full items-center gap-2 px-2 py-1.5 text-sm',
          'hover:bg-accent/50 text-muted-foreground transition-colors',
          className
        )}
      >
        <Search className="h-4 w-4" />
        <span>搜索文件</span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none">
          <span className="text-xs">⌘</span>P
        </kbd>
      </button>
    );
  }

  return (
    <div className={cn('bg-background flex flex-col border-b', className)}>
      <div className="flex items-center gap-2 border-b px-2 py-2">
        <Search className="text-muted-foreground h-4 w-4 shrink-0" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索文件名..."
          className="h-7 flex-1 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
        />
        <button
          onClick={toggleCaseSensitive}
          className={cn('hover:bg-accent rounded p-1 transition-colors', caseSensitive && 'bg-accent text-foreground')}
          title={caseSensitive ? '区分大小写' : '不区分大小写'}
        >
          <span className="text-xs font-semibold">Aa</span>
        </button>
        {query && (
          <button onClick={() => setQuery('')} className="hover:bg-accent rounded p-1 transition-colors" title="清除">
            <FilterX className="h-4 w-4" />
          </button>
        )}
        <button onClick={() => setIsOpen(false)} className="hover:bg-accent rounded p-1 transition-colors" title="关闭">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isSearching && <div className="text-muted-foreground px-4 py-8 text-center text-sm">搜索中...</div>}

      {!isSearching && query && results.length === 0 && (
        <div className="text-muted-foreground px-4 py-8 text-center text-sm">未找到匹配的文件</div>
      )}

      {!isSearching && results.length > 0 && (
        <ScrollArea className="max-h-75">
          <div className="py-1">
            {results.map((result, index) => (
              <SearchResultItem
                key={result.path}
                result={result}
                isSelected={index === selectedIndex}
                onClick={() => handleSelectResult(result)}
                onHover={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {results.length > 0 && (
        <div className="text-muted-foreground bg-muted/30 border-t px-3 py-1.5 text-xs">
          找到 {results.length} 个结果
        </div>
      )}
    </div>
  );
};

interface SearchResultItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, isSelected, onClick, onHover }) => {
  const highlightedName = React.useMemo(() => {
    return result.name;
  }, [result.name]);

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-sm',
        'hover:bg-accent/50 text-left transition-colors',
        isSelected && 'bg-accent'
      )}
    >
      {result.isDirectory ? (
        <Folder className="h-4 w-4 shrink-0 text-blue-500" />
      ) : (
        <File className="h-4 w-4 shrink-0 text-gray-500" />
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{highlightedName}</div>
        <div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
          {result.directory.split(path.sep).map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-3 w-3 shrink-0" />}
              <span className="truncate">{segment}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
    </button>
  );
};

SearchResultItem.displayName = 'SearchResultItem';
