import { v4 as uuidv4 } from 'uuid';

export const generateId = () => uuidv4();

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  if (days < 30) {
    return `${days}天前`;
  }
  return new Date(timestamp).toLocaleDateString();
};

export const getFileIconColor = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
      return 'text-yellow-500';
    case 'ts':
    case 'tsx':
    case 'jsx':
      return 'text-blue-500';
    case 'css':
    case 'scss':
    case 'sass':
      return 'text-pink-500';
    case 'html':
    case 'htm':
      return 'text-orange-500';
    case 'json':
      return 'text-green-500';
    case 'md':
    case 'markdown':
      return 'text-gray-500';
    case 'py':
      return 'text-yellow-600';
    case 'java':
      return 'text-red-500';
    case 'go':
      return 'text-cyan-500';
    case 'rs':
      return 'text-orange-600';
    case 'vue':
      return 'text-green-400';
    default:
      return 'text-gray-400';
  }
};

export const searchInTree = <T extends { id: string; children?: T[] }>(items: T[], id: string): T | null => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.children) {
      const found = searchInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const updateInTree = <T extends { id: string; children?: T[] }>(
  items: T[],
  id: string,
  updates: Partial<Omit<T, 'id'>>
): T[] => {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.children) {
      return { ...item, children: updateInTree(item.children, id, updates) };
    }
    return item;
  });
};

export const deleteFromTree = <T extends { id: string; children?: T[] }>(items: T[], id: string): T[] => {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? deleteFromTree(item.children, id) : undefined
    }));
};
