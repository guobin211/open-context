import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  className?: string;
}

const SAMPLE_PDF_URL =
  'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

export const PdfViewer = ({ className }: PdfViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pdfUrl, setPdfUrl] = useState<string>(SAMPLE_PDF_URL);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(2.0, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-4 flex items-center gap-2">
        <input
          type="text"
          value={pdfUrl}
          onChange={(e) => setPdfUrl(e.target.value)}
          placeholder="输入 PDF URL..."
          className="border-border bg-background focus:ring-primary flex-1 rounded border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
        <button
          onClick={() => setPdfUrl(SAMPLE_PDF_URL)}
          className="border-border hover:bg-accent rounded border px-3 py-2 text-sm transition-colors"
        >
          示例 PDF
        </button>
      </div>

      <div className="border-border bg-card mb-4 flex items-center justify-between rounded-lg border p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="hover:bg-accent rounded p-2 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm">
            第 {pageNumber} / {numPages || '?'} 页
          </span>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="hover:bg-accent rounded p-2 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="hover:bg-accent rounded p-2 transition-colors disabled:opacity-50"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <button
            onClick={zoomIn}
            disabled={scale >= 2.0}
            className="hover:bg-accent rounded p-2 transition-colors disabled:opacity-50"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </div>

      <div className="border-border bg-card flex-1 overflow-auto rounded-lg border p-4">
        <div className="flex justify-center">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => console.error('PDF 加载错误:', error)}
            loading={
              <div className="flex h-96 items-center justify-center">
                <span className="text-muted-foreground text-sm">加载 PDF 中...</span>
              </div>
            }
            error={
              <div className="flex h-96 items-center justify-center">
                <span className="text-destructive text-sm">PDF 加载失败，请检查 URL 是否正确</span>
              </div>
            }
          >
            <Page pageNumber={pageNumber} scale={scale} renderTextLayer={true} renderAnnotationLayer={true} />
          </Document>
        </div>
      </div>
    </div>
  );
};
