import { Link, useRouterState } from '@tanstack/react-router';
import {
  FileText,
  Type,
  Code,
  Terminal,
  Globe,
  FolderTree,
  Grid3x3,
  MessageSquare,
  Braces,
  GitBranch,
  Image,
  FileSpreadsheet,
  FileType,
  File,
  BarChart3,
  Workflow,
  CloudUpload,
  QrCode,
  ScanText,
  List,
  Pi,
  Keyboard,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaygroundItem {
  path: string;
  icon: typeof FileText;
  label: string;
}

const playgroundItems: PlaygroundItem[] = [
  { path: '/playground/markdown', icon: FileText, label: 'Markdown 编辑器' },
  { path: '/playground/rich-text', icon: Type, label: '富文本编辑器' },
  { path: '/playground/code-editor', icon: Code, label: '代码编辑器' },
  { path: '/playground/terminal', icon: Terminal, label: '终端模拟器' },
  { path: '/playground/webview', icon: Globe, label: '网页浏览器' },
  { path: '/playground/file-tree', icon: FolderTree, label: '文件树' },
  { path: '/playground/file-manager', icon: Grid3x3, label: '文件管理器' },
  { path: '/playground/chat', icon: MessageSquare, label: '聊天界面' },
  { path: '/playground/json-editor', icon: Braces, label: 'JSON 编辑器' },
  { path: '/playground/ast-viewer', icon: GitBranch, label: 'AST 查看器' },
  { path: '/playground/image-editor', icon: Image, label: '图片编辑器' },
  { path: '/playground/excel-viewer', icon: FileSpreadsheet, label: 'Excel 查看器' },
  { path: '/playground/pdf-viewer', icon: FileType, label: 'PDF 查看器' },
  { path: '/playground/word-viewer', icon: File, label: 'Word 查看器' },
  { path: '/playground/data-viz', icon: BarChart3, label: '数据可视化' },
  { path: '/playground/workflow-editor', icon: Workflow, label: '工作流编辑器' },
  { path: '/playground/cos-upload', icon: CloudUpload, label: '云存储上传' },
  { path: '/playground/excel-to-json', icon: FileSpreadsheet, label: 'Excel 转 JSON' },
  { path: '/playground/diff-viewer', icon: Braces, label: 'Diff 查看器' },
  { path: '/playground/drag-and-drop', icon: Workflow, label: '拖拽演示' },
  { path: '/playground/png-parser', icon: Image, label: 'PNG 解析器' },
  { path: '/playground/cropper-demo', icon: Image, label: '图片裁剪' },
  { path: '/playground/qrcode-generator', icon: QrCode, label: '二维码生成器' },
  { path: '/playground/ocr-viewer', icon: ScanText, label: 'OCR 文字识别' },
  { path: '/playground/virtual-list', icon: List, label: '虚拟列表' },
  { path: '/playground/katex-math', icon: Pi, label: '数学公式渲染' },
  { path: '/playground/hotkeys-demo', icon: Keyboard, label: '快捷键演示' },
  { path: '/playground/xml-parser', icon: FileCode, label: 'XML 解析器' }
];

export const PlaygroundNavigation = () => {
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <div className="p-4">
      <h2 className="text-muted-foreground mb-2 text-sm font-semibold">组件示例</h2>
      <nav className="space-y-1">
        {playgroundItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
