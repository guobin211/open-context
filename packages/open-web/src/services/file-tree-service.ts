import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import path from 'path-browserify';

export interface FileTreeNode {
  path: string;
  name: string;
  isDirectory: boolean;
  isHidden: boolean;
  size?: number;
  modified?: number;
  children?: FileTreeNode[];
  isExpanded?: boolean;
  isLoading?: boolean;
  depth?: number;
}

export interface FileTreeState {
  rootPath: string;
  nodes: Map<string, FileTreeNode>;
  expandedPaths: Set<string>;
  selectedPath?: string;
}

export class FileTreeService {
  private state: FileTreeState;
  private listeners: Map<string, () => void> = new Map();
  private stateChangeCallbacks: Set<(state: FileTreeState) => void> = new Set();

  constructor(rootPath: string) {
    this.state = {
      rootPath,
      nodes: new Map(),
      expandedPaths: new Set()
    };
  }

  async initialize() {
    await this.loadRoot();
    await this.initWatcher();
    await this.listenToFileChanges();
  }

  private async loadRoot() {
    const nodes = await invoke<FileTreeNode[]>('read_dir', {
      dirPath: this.state.rootPath
    });

    const rootNode: FileTreeNode = {
      path: this.state.rootPath,
      name: path.basename(this.state.rootPath),
      isDirectory: true,
      isHidden: false,
      isExpanded: true,
      depth: 0,
      children: nodes
    };

    this.state.nodes.set(this.state.rootPath, rootNode);
    this.state.expandedPaths.add(this.state.rootPath);

    nodes.forEach((node) => {
      this.state.nodes.set(node.path, { ...node, depth: 1 });
    });

    this.notifyStateChange();
  }

  async toggleExpand(nodePath: string) {
    const node = this.state.nodes.get(nodePath);
    if (!node || !node.isDirectory) return;

    if (this.state.expandedPaths.has(nodePath)) {
      this.state.expandedPaths.delete(nodePath);
      node.isExpanded = false;
    } else {
      await this.expandNode(nodePath);
    }

    this.notifyStateChange();
  }

  private async expandNode(nodePath: string) {
    const node = this.state.nodes.get(nodePath);
    if (!node || !node.isDirectory) return;

    node.isLoading = true;
    this.notifyStateChange();

    try {
      const children = await invoke<FileTreeNode[]>('read_dir', {
        dirPath: nodePath
      });

      const depth = (node.depth ?? 0) + 1;
      children.forEach((child) => {
        this.state.nodes.set(child.path, { ...child, depth });
      });

      node.children = children;
      node.isExpanded = true;
      this.state.expandedPaths.add(nodePath);
    } catch (error) {
      console.error(`Failed to expand ${nodePath}:`, error);
    } finally {
      node.isLoading = false;
      this.notifyStateChange();
    }
  }

  private async initWatcher() {
    try {
      await invoke('watch_dir', { dirPath: this.state.rootPath });
    } catch (error) {
      console.error('Failed to initialize file watcher:', error);
    }
  }

  private async listenToFileChanges() {
    const unlisten = await listen('file-tree-state-change', () => {
      this.refreshExpandedNodes();
    });

    this.listeners.set('file-tree-state-change', unlisten);
  }

  private async refreshExpandedNodes() {
    const expandedPaths = Array.from(this.state.expandedPaths);

    for (const nodePath of expandedPaths) {
      const node = this.state.nodes.get(nodePath);
      if (!node) continue;

      try {
        const children = await invoke<FileTreeNode[]>('read_dir', {
          dirPath: nodePath
        });

        const depth = (node.depth ?? 0) + 1;
        children.forEach((child) => {
          this.state.nodes.set(child.path, { ...child, depth });
        });

        node.children = children;
      } catch (error) {
        console.error(`Failed to refresh ${nodePath}:`, error);
      }
    }

    this.notifyStateChange();
  }

  async createFile(parentPath: string, name: string, isDirectory: boolean) {
    const newPath = path.join(parentPath, name);

    try {
      await invoke('create_file_or_dir', { path: newPath, isDirectory });
      await this.refreshNode(parentPath);
      return newPath;
    } catch (error) {
      console.error('Failed to create file:', error);
      throw error;
    }
  }

  async rename(oldPath: string, newName: string) {
    const parentPath = path.dirname(oldPath);
    const newPath = path.join(parentPath, newName);

    try {
      await invoke('rename_file_or_dir', { oldPath, newPath });
      await this.refreshNode(parentPath);
      return newPath;
    } catch (error) {
      console.error('Failed to rename:', error);
      throw error;
    }
  }

  async delete(nodePath: string) {
    try {
      await invoke('delete_file_or_dir', { path: nodePath });
      const parentPath = path.dirname(nodePath);
      await this.refreshNode(parentPath);

      this.state.nodes.delete(nodePath);
      this.state.expandedPaths.delete(nodePath);

      if (this.state.selectedPath === nodePath) {
        this.state.selectedPath = undefined;
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      throw error;
    }
  }

  private async refreshNode(nodePath: string) {
    const node = this.state.nodes.get(nodePath);
    if (!node || !node.isDirectory) return;

    try {
      const children = await invoke<FileTreeNode[]>('read_dir', {
        dirPath: nodePath
      });

      const depth = (node.depth ?? 0) + 1;
      children.forEach((child) => {
        this.state.nodes.set(child.path, { ...child, depth });
      });

      node.children = children;
      this.notifyStateChange();
    } catch (error) {
      console.error(`Failed to refresh ${nodePath}:`, error);
    }
  }

  async search(pattern: string, caseSensitive = false): Promise<string[]> {
    try {
      return await invoke<string[]>('search_workspace_files', {
        rootPath: this.state.rootPath,
        pattern,
        caseSensitive
      });
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  selectNode(nodePath: string) {
    this.state.selectedPath = nodePath;
    this.notifyStateChange();
  }

  getFlattenedNodes(): FileTreeNode[] {
    const result: FileTreeNode[] = [];

    const traverse = (node: FileTreeNode) => {
      result.push(node);

      if (node.isExpanded && node.children) {
        node.children.forEach(traverse);
      }
    };

    const rootNode = this.state.nodes.get(this.state.rootPath);
    if (rootNode) {
      traverse(rootNode);
    }

    return result;
  }

  onStateChange(callback: (state: FileTreeState) => void) {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  private notifyStateChange() {
    this.stateChangeCallbacks.forEach((callback) => {
      callback(this.state);
    });
  }

  getState(): FileTreeState {
    return this.state;
  }

  async destroy() {
    try {
      await invoke('stop_watch_dir', { dirPath: this.state.rootPath });
    } catch (error) {
      console.error('Failed to stop watcher:', error);
    }

    this.listeners.forEach((unlisten) => unlisten());
    this.listeners.clear();
    this.stateChangeCallbacks.clear();
  }
}
