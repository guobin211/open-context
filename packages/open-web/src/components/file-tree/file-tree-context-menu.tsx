import React, { useState } from 'react';
import { FileTreeNode, FileTreeService } from '@/services';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FilePlus, FolderPlus, Pencil, Trash2, RefreshCw } from 'lucide-react';

interface FileTreeContextMenuProps {
  node: FileTreeNode;
  service: FileTreeService;
  children: React.ReactNode;
}

export const FileTreeContextMenu: React.FC<FileTreeContextMenuProps> = ({ node, service, children }) => {
  const [dialogState, setDialogState] = useState<{
    type: 'create' | 'rename' | 'delete' | null;
    isDirectory?: boolean;
  }>({ type: null });
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = (isDirectory: boolean) => {
    setDialogState({ type: 'create', isDirectory });
    setInputValue('');
  };

  const handleRename = () => {
    setDialogState({ type: 'rename' });
    setInputValue(node.name);
  };

  const handleDelete = () => {
    setDialogState({ type: 'delete' });
  };

  const handleRefresh = async () => {
    if (node.isDirectory) {
      await service.toggleExpand(node.path);
      await service.toggleExpand(node.path);
    }
  };

  const confirmCreate = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);
    try {
      const parentPath = node.isDirectory ? node.path : node.path.replace(/[^/]+$/, '');
      await service.createFile(parentPath, inputValue, dialogState.isDirectory ?? false);
      setDialogState({ type: null });
      setInputValue('');
    } catch (error) {
      console.error('Create failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRename = async () => {
    if (!inputValue.trim() || inputValue === node.name) return;

    setIsLoading(true);
    try {
      await service.rename(node.path, inputValue);
      setDialogState({ type: null });
      setInputValue('');
    } catch (error) {
      console.error('Rename failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    setIsLoading(true);
    try {
      await service.delete(node.path);
      setDialogState({ type: null });
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          {node.isDirectory && (
            <>
              <ContextMenuItem onClick={() => handleCreate(false)}>
                <FilePlus className="mr-2 h-4 w-4" />
                新建文件
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreate(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                新建文件夹
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          <ContextMenuItem onClick={handleRename}>
            <Pencil className="mr-2 h-4 w-4" />
            重命名
          </ContextMenuItem>

          <ContextMenuItem onClick={handleDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            删除
          </ContextMenuItem>

          {node.isDirectory && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog
        open={dialogState.type === 'create'}
        onOpenChange={(open: boolean) => !open && setDialogState({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.isDirectory ? '新建文件夹' : '新建文件'}</DialogTitle>
            <DialogDescription>请输入{dialogState.isDirectory ? '文件夹' : '文件'}名称</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">名称</Label>
              <Input
                id="name"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={dialogState.isDirectory ? '文件夹名称' : '文件名称'}
                onKeyDown={(e) => e.key === 'Enter' && confirmCreate()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null })}>
              取消
            </Button>
            <Button onClick={confirmCreate} disabled={isLoading || !inputValue.trim()}>
              {isLoading ? '创建中...' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogState.type === 'rename'}
        onOpenChange={(open: boolean) => !open && setDialogState({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
            <DialogDescription>请输入新的名称</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename">名称</Label>
              <Input
                id="rename"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null })}>
              取消
            </Button>
            <Button onClick={confirmRename} disabled={isLoading || !inputValue.trim()}>
              {isLoading ? '重命名中...' : '重命名'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogState.type === 'delete'}
        onOpenChange={(open: boolean) => !open && setDialogState({ type: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除 {node.isDirectory ? '文件夹' : '文件'} "{node.name}" 吗？
              {node.isDirectory && '此操作将递归删除所有子项。'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState({ type: null })}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
              {isLoading ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
