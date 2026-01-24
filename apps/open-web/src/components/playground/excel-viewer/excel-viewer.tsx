import { Workbook } from '@fortune-sheet/react';
import '@fortune-sheet/react/dist/index.css';
import { cn } from '@/lib/utils';

interface ExcelViewerProps {
  className?: string;
}

const DEMO_DATA = [
  {
    name: 'Sheet1',
    color: '',
    status: 1,
    order: 0,
    data: [
      [
        { v: '产品名称', ct: { fa: 'General', t: 'g' }, m: '产品名称' },
        { v: '数量', ct: { fa: 'General', t: 'g' }, m: '数量' },
        { v: '单价', ct: { fa: 'General', t: 'g' }, m: '单价' },
        { v: '总价', ct: { fa: 'General', t: 'g' }, m: '总价' }
      ],
      [
        { v: 'MacBook Pro', ct: { fa: 'General', t: 'g' }, m: 'MacBook Pro' },
        { v: 10, ct: { fa: 'General', t: 'n' }, m: '10' },
        { v: 15000, ct: { fa: 'General', t: 'n' }, m: '15000' },
        { v: 150000, ct: { fa: 'General', t: 'n' }, m: '150000' }
      ],
      [
        { v: 'iPhone 15', ct: { fa: 'General', t: 'g' }, m: 'iPhone 15' },
        { v: 20, ct: { fa: 'General', t: 'n' }, m: '20' },
        { v: 6000, ct: { fa: 'General', t: 'n' }, m: '6000' },
        { v: 120000, ct: { fa: 'General', t: 'n' }, m: '120000' }
      ],
      [
        { v: 'iPad Air', ct: { fa: 'General', t: 'g' }, m: 'iPad Air' },
        { v: 15, ct: { fa: 'General', t: 'n' }, m: '15' },
        { v: 4500, ct: { fa: 'General', t: 'n' }, m: '4500' },
        { v: 67500, ct: { fa: 'General', t: 'n' }, m: '67500' }
      ],
      [
        { v: 'AirPods Pro', ct: { fa: 'General', t: 'g' }, m: 'AirPods Pro' },
        { v: 30, ct: { fa: 'General', t: 'n' }, m: '30' },
        { v: 1500, ct: { fa: 'General', t: 'n' }, m: '1500' },
        { v: 45000, ct: { fa: 'General', t: 'n' }, m: '45000' }
      ],
      [
        { v: '合计', ct: { fa: 'General', t: 'g' }, m: '合计' },
        { v: 75, ct: { fa: 'General', t: 'n' }, m: '75' },
        { v: '', ct: { fa: 'General', t: 'g' }, m: '' },
        { v: 382500, ct: { fa: 'General', t: 'n' }, m: '382500' }
      ]
    ],
    config: {
      merge: {},
      rowlen: {},
      columnlen: {}
    }
  }
];

export const ExcelViewer = ({ className }: ExcelViewerProps) => {
  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-border bg-card mb-4 rounded-lg border p-3">
        <p className="text-muted-foreground text-sm">
          这是一个演示 Excel 表格，支持单元格编辑、公式计算、格式化等功能。
        </p>
      </div>

      <div className="border-border flex-1 overflow-hidden rounded-lg border">
        <Workbook data={DEMO_DATA} />
      </div>
    </div>
  );
};
