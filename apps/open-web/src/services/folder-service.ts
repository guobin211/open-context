import { readDir, type DirEntry } from '@tauri-apps/plugin-fs';
import type { FileNode } from '../storage/right-sidebar-store';

// 忽略的目录
const IGNORED_DIRECTORIES = ['.git'];

// 忽略的文件
const IGNORED_FILES: string[] = ['.DS_Store'];

/**
 * 判断是否应该忽略该条目
 */
const shouldIgnoreEntry = (entry: DirEntry): boolean => {
  if (entry.isDirectory) {
    return IGNORED_DIRECTORIES.includes(entry.name);
  }
  return IGNORED_FILES.includes(entry.name);
};

/**
 * 对文件节点进行排序（文件夹在前，文件在后，按名称排序）
 */
const sortFileNodes = (nodes: FileNode[]): FileNode[] => {
  return nodes.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });
};

/**
 * 将 DirEntry 转换为 FileNode
 */
const convertToFileNode = (entry: DirEntry, parentPath: string): FileNode => {
  const path = `${parentPath}/${entry.name}`;
  return {
    name: entry.name,
    path,
    isDirectory: entry.isDirectory,
    children: entry.isDirectory ? [] : undefined
  };
};

/**
 * 递归读取目录结构
 */
export const readDirectoryRecursive = async (dirPath: string, maxDepth = 3, currentDepth = 0): Promise<FileNode[]> => {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = await readDir(dirPath);
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (shouldIgnoreEntry(entry)) {
        continue;
      }

      const node = convertToFileNode(entry, dirPath);

      if (entry.isDirectory && currentDepth < maxDepth - 1) {
        node.children = await readDirectoryRecursive(node.path, maxDepth, currentDepth + 1);
      }

      nodes.push(node);
    }

    return sortFileNodes(nodes);
  } catch (error) {
    console.error('Error reading directory:');
    console.error(error);
    return [];
  }
};
