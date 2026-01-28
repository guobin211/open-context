import { useState } from 'react';
import { Upload, Download, File as FileIcon, FileSpreadsheet, Code, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';

interface ExcelToJsonProps {
  className?: string;
}

export const ExcelToJson = ({ className }: ExcelToJsonProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile).catch(console.error);
    }
  };

  const processFile = async (excelFile: File) => {
    setLoading(true);
    try {
      const data = await excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });

      const firstSheetName = workbook.SheetNames[0];
      setSheetName(firstSheetName);

      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: true
      });

      setJsonData(JSON.stringify(json, null, 2));
    } catch (error) {
      console.error('Excel 解析失败:', error);
      alert(`Excel 解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!jsonData) return;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name.replace(/\.[^/.]+$/, '') || 'data'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    if (!jsonData || !sheetName) return;

    const json = JSON.parse(jsonData);
    const worksheet = XLSX.utils.json_to_sheet(json);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    XLSX.writeFile(workbook, `${file?.name || 'data'}.xlsx`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      processFile(droppedFile).catch(console.error);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const rowCount = jsonData ? JSON.parse(jsonData).length : 0;

  return (
    <div className={cn('flex h-full gap-6', className)}>
      <div className="flex min-w-100 flex-col gap-4">
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileSpreadsheet className="size-5" />
            Excel 转 JSON
          </h2>

          <div
            className={cn(
              'border-border rounded-lg border-2 border-dashed p-8 text-center transition-colors',
              'hover:border-primary hover:bg-primary/5'
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input type="file" accept=".xlsx,.xls" onChange={handleFileSelect} className="hidden" id="excel-upload" />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <Upload className="text-muted-foreground mx-auto mb-3 size-12" />
              <p className="text-muted-foreground text-sm">拖拽 Excel 文件到此处</p>
              <p className="text-muted-foreground mb-4 text-xs">或点击选择文件</p>
              <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2 text-sm transition-colors">
                选择文件
              </button>
            </label>
          </div>

          {file && (
            <div className="mt-4 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <FileIcon className="size-4 text-green-600" />
                <span className="font-medium">{file.name}</span>
              </div>
              <div className="text-muted-foreground mt-2 text-xs">
                大小: {formatFileSize(file.size)} | 类型: {file.type || 'Excel 文件'}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-3 font-semibold">统计信息</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">工作表名称:</span>
              <span className="font-medium">{sheetName || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">数据行数:</span>
              <span className="font-medium">{rowCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">JSON 大小:</span>
              <span className="font-medium">{jsonData ? `${(jsonData.length / 1024).toFixed(2)} KB` : '-'}</span>
            </div>
          </div>
        </div>

        {jsonData && (
          <div className="flex gap-2">
            <button
              onClick={handleDownloadJson}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
            >
              <Download className="size-4" />
              下载 JSON
            </button>
            <button
              onClick={handleDownloadExcel}
              className="bg-muted hover:bg-muted/80 text-foreground flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
            >
              <FileSpreadsheet className="size-4" />
              下载 Excel
            </button>
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold">
              <Code className="size-5" />
              JSON 输出
            </h3>
            {file && (
              <button
                onClick={() => processFile(file)}
                className="bg-muted hover:bg-muted/80 text-foreground flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
                title="重新处理"
              >
                <RefreshCw className="size-3" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="bg-muted min-harez-[300px] flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="border-primary mx-auto mb-3 size-8 animate-spin rounded-full border-4 border-t-transparent" />
                <p className="text-muted-foreground text-sm">正在解析...</p>
              </div>
            </div>
          ) : jsonData ? (
            <div className="bg-muted min-harez-[300px] overflow-auto rounded-lg p-4">
              <pre className="text-sm">{jsonData}</pre>
            </div>
          ) : (
            <div className="bg-muted min-harez-[300px] flex items-center justify-center rounded-lg">
              <div className="text-center">
                <FileIcon className="text-muted-foreground mx-auto mb-3 size-12" />
                <p className="text-muted-foreground text-sm">请选择 Excel 文件</p>
                <p className="text-muted-foreground mt-1 text-xs">支持 .xlsx 和 .xls 格式</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">功能说明</h3>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
            <li>使用 XLSX 库解析 Excel 文件</li>
            <li>支持拖拽上传和点击选择</li>
            <li>自动转换第一个工作表为 JSON</li>
            <li>支持导出 JSON 和重新生成 Excel</li>
            <li>显示文件统计和转换结果</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
