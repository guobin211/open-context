import { createFileRoute, Link } from '@tanstack/react-router';
import { useRouter } from '@tanstack/react-router';
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
import {
  PlaygroundLayout,
  PlaygroundSidebar,
  PlaygroundContent,
  PlaygroundHeader,
  PlaygroundMain
} from '@/routes/playground/components';
import { cn } from '@/lib/utils';

interface PlaygroundItem {
  path: string;
  icon: typeof FileText;
  label: string;
  description: string;
}

const playgroundItems: PlaygroundItem[] = [
  {
    path: '/playground/markdown',
    icon: FileText,
    label: 'Markdown 编辑器',
    description: '支持 GFM 语法和实时预览'
  },
  {
    path: '/playground/rich-text',
    icon: Type,
    label: '富文本编辑器',
    description: '基于 Tiptap 的所见即所得编辑器'
  },
  {
    path: '/playground/code-editor',
    icon: Code,
    label: '代码编辑器',
    description: 'Monaco Editor，支持多语言'
  },
  {
    path: '/playground/terminal',
    icon: Terminal,
    label: '终端模拟器',
    description: '基于 xterm.js 的终端'
  },
  {
    path: '/playground/webview',
    icon: Globe,
    label: '网页浏览器',
    description: 'Tauri WebviewWindow'
  },
  {
    path: '/playground/file-tree',
    icon: FolderTree,
    label: '文件树',
    description: 'VS Code 风格文件树'
  },
  {
    path: '/playground/file-manager',
    icon: Grid3x3,
    label: '文件管理器',
    description: 'Spacedrive 风格视图'
  },
  {
    path: '/playground/chat',
    icon: MessageSquare,
    label: '聊天界面',
    description: '消息气泡和输入框'
  },
  {
    path: '/playground/json-editor',
    icon: Braces,
    label: 'JSON 编辑器',
    description: '支持编辑和树形视图'
  },
  {
    path: '/playground/ast-viewer',
    icon: GitBranch,
    label: 'AST 查看器',
    description: '代码语法树可视化'
  },
  {
    path: '/playground/image-editor',
    icon: Image,
    label: '图片编辑器',
    description: '裁剪、滤镜和压缩'
  },
  {
    path: '/playground/excel-viewer',
    icon: FileSpreadsheet,
    label: 'Excel 查看器',
    description: '类 Excel 表格'
  },
  {
    path: '/playground/pdf-viewer',
    icon: FileType,
    label: 'PDF 查看器',
    description: 'PDF 文档渲染'
  },
  {
    path: '/playground/word-viewer',
    icon: File,
    label: 'Word 查看器',
    description: 'DOCX 文档查看'
  },
  {
    path: '/playground/data-viz',
    icon: BarChart3,
    label: '数据可视化',
    description: 'AntV G2 图表示例'
  },
  {
    path: '/playground/workflow-editor',
    icon: Workflow,
    label: '工作流编辑器',
    description: 'React Flow 节点编辑器'
  },
  {
    path: '/playground/cos-upload',
    icon: CloudUpload,
    label: '云存储上传',
    description: '多云存储文件上传'
  },
  {
    path: '/playground/excel-to-json',
    icon: FileSpreadsheet,
    label: 'Excel 转 JSON',
    description: 'XLSX 库解析为 JSON 数据'
  },
  {
    path: '/playground/diff-viewer',
    icon: Braces,
    label: 'Diff 查看器',
    description: 'diff-js 库差异比较'
  },
  {
    path: '/playground/drag-and-drop',
    icon: Workflow,
    label: '拖拽演示',
    description: '原生 HTML5 拖拽 API'
  },
  {
    path: '/playground/png-parser',
    icon: Image,
    label: 'PNG 解析器',
    description: 'png-js 库解析 PNG 图片'
  },
  {
    path: '/playground/cropper-demo',
    icon: Image,
    label: '图片裁剪',
    description: 'cropperjs 图片裁剪'
  },
  {
    path: '/playground/qrcode-generator',
    icon: QrCode,
    label: '二维码生成器',
    description: 'qrcode 生成二维码'
  },
  {
    path: '/playground/ocr-viewer',
    icon: ScanText,
    label: 'OCR 文字识别',
    description: 'tesseract.js 图片文字识别'
  },
  {
    path: '/playground/virtual-list',
    icon: List,
    label: '虚拟列表',
    description: '@tanstack/react-virtual 大数据渲染'
  },
  {
    path: '/playground/katex-math',
    icon: Pi,
    label: '数学公式渲染',
    description: 'KaTeX 数学公式'
  },
  {
    path: '/playground/hotkeys-demo',
    icon: Keyboard,
    label: '快捷键演示',
    description: 'react-hotkeys-hook 快捷键绑定'
  },
  {
    path: '/playground/xml-parser',
    icon: FileCode,
    label: 'XML 解析器',
    description: 'fast-xml-parser XML/JSON 互转'
  }
];

const RouteComponent = () => {
  const router = useRouter();

  return (
    <PlaygroundLayout>
      <PlaygroundSidebar>
        <div className="p-4">
          <h2 className="text-muted-foreground mb-2 text-sm font-semibold">组件示例</h2>
          <nav className="space-y-1">
            {playgroundItems.map((item) => {
              const Icon = item.icon;
              const isActive = router.state.location.pathname === item.path;

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
      </PlaygroundSidebar>

      <PlaygroundContent>
        <PlaygroundHeader title="组件展示平台" />
        <PlaygroundMain className="p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <h1 className="mb-2 text-3xl font-bold">组件展示平台</h1>
              <p className="text-muted-foreground">快速验证和测试各种编辑器、查看器和工具组件</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {playgroundItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group border-border bg-card hover:border-primary hover:bg-primary/5 p-6 transition-colors"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="bg-primary/10 rounded-md p-2">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="group-hover:text-primary font-semibold">{item.label}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </PlaygroundMain>
      </PlaygroundContent>
    </PlaygroundLayout>
  );
};

export const Route = createFileRoute('/playground/')({
  component: RouteComponent
});
