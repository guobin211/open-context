import { useEffect, useRef, useState } from 'react';
import { Chart } from '@antv/g2';
import { cn } from '@/lib/utils';

interface DataVizProps {
  className?: string;
}

type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar' | 'heatmap' | 'funnel' | 'gauge';

export const DataViz = ({ className }: DataVizProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');

  useEffect(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const chart = new Chart({
      container: containerRef.current,
      autoFit: true,
      height: 500
    });

    switch (chartType) {
      case 'line': {
        const lineData = [
          { month: '1月', value: 350 },
          { month: '2月', value: 450 },
          { month: '3月', value: 470 },
          { month: '4月', value: 520 },
          { month: '5月', value: 600 },
          { month: '6月', value: 750 }
        ];

        chart
          .line()
          .data(lineData)
          .encode('x', 'month')
          .encode('y', 'value')
          .style('stroke', '#5B8FF9')
          .style('lineWidth', 2);

        chart.point().data(lineData).encode('x', 'month').encode('y', 'value').style('fill', '#5B8FF9').style('r', 4);
        break;
      }

      case 'bar': {
        const barData = [
          { category: 'TypeScript', count: 1200 },
          { category: 'JavaScript', count: 950 },
          { category: 'Python', count: 800 },
          { category: 'Rust', count: 600 },
          { category: 'Go', count: 450 }
        ];

        chart.interval().data(barData).encode('x', 'category').encode('y', 'count').style('fill', '#5B8FF9');
        break;
      }

      case 'area': {
        const areaData = [
          { month: 'Jan', value: 30, group: 'Series A' },
          { month: 'Feb', value: 45, group: 'Series A' },
          { month: 'Mar', value: 60, group: 'Series A' },
          { month: 'Apr', value: 70, group: 'Series A' },
          { month: 'May', value: 90, group: 'Series A' },
          { month: 'Jan', value: 20, group: 'Series B' },
          { month: 'Feb', value: 35, group: 'Series B' },
          { month: 'Mar', value: 50, group: 'Series B' },
          { month: 'Apr', value: 65, group: 'Series B' },
          { month: 'May', value: 80, group: 'Series B' }
        ];

        chart
          .area()
          .data(areaData)
          .encode('x', 'month')
          .encode('y', 'value')
          .encode('color', 'group')
          .style('fillOpacity', 0.6);
        break;
      }

      case 'pie': {
        const pieData = [
          { type: '前端开发', value: 40 },
          { type: '后端开发', value: 30 },
          { type: '数据分析', value: 15 },
          { type: '机器学习', value: 10 },
          { type: '其他', value: 5 }
        ];

        chart
          .interval()
          .data(pieData)
          .transform({ type: 'stackY' })
          .coordinate({ type: 'theta' })
          .encode('y', 'value')
          .encode('color', 'type')
          .legend('color', { position: 'right' });
        break;
      }

      case 'donut': {
        const donutData = [
          { category: 'Chrome', value: 61.04 },
          { category: 'Safari', value: 15.12 },
          { category: 'Edge', value: 12.53 },
          { category: 'Firefox', value: 5.91 },
          { category: '其他', value: 5.4 }
        ];

        chart
          .interval()
          .data(donutData)
          .transform({ type: 'stackY' })
          .coordinate({ type: 'theta', inner: 0.6 })
          .encode('y', 'value')
          .encode('color', 'category')
          .legend('color', { position: 'right' });
        break;
      }

      case 'scatter': {
        const scatterData = Array.from({ length: 50 }, (_, i) => ({
          x: Math.random() * 100,
          y: Math.random() * 100,
          group: i % 2 === 0 ? 'A' : 'B'
        }));

        chart.point().data(scatterData).encode('x', 'x').encode('y', 'y').encode('color', 'group').style('r', 6);
        break;
      }

      case 'radar': {
        const radarData = [
          { category: 'React', value: 90 },
          { category: 'Vue', value: 85 },
          { category: 'Angular', value: 75 },
          { category: 'Svelte', value: 80 },
          { category: 'Solid', value: 70 }
        ];

        chart
          .line()
          .data(radarData)
          .encode('x', 'category')
          .encode('y', 'value')
          .scale('y', { domainMax: 100 })
          .coordinate({ type: 'polar' })
          .axis('x', { grid: true })
          .axis('y', { grid: true, zIndex: 0 })
          .style('stroke', '#5B8FF9')
          .style('lineWidth', 2);

        chart
          .point()
          .data(radarData)
          .encode('x', 'category')
          .encode('y', 'value')
          .style('fill', '#5B8FF9')
          .style('r', 4);
        break;
      }

      case 'heatmap': {
        const heatmapData = [];
        for (let i = 0; i < 7; i++) {
          for (let j = 0; j < 12; j++) {
            heatmapData.push({
              x: `Mon ${i + 1}`,
              y: `Hour ${j + 1}`,
              value: Math.random() * 100
            });
          }
        }

        chart
          .cell()
          .data(heatmapData)
          .encode('x', 'x')
          .encode('y', 'y')
          .encode('color', 'value')
          .scale('color', { type: 'linear', palette: 'red' })
          .legend('color', { position: 'top' })
          .style('inset', 1);
        break;
      }

      case 'funnel': {
        const funnelData = [
          { stage: '曝光', value: 10000 },
          { stage: '点击', value: 7000 },
          { stage: '访问', value: 5000 },
          { stage: '咨询', value: 3000 },
          { stage: '订单', value: 1500 }
        ];

        chart
          .interval()
          .data(funnelData)
          .transform({ type: 'flexX' })
          .coordinate({ type: 'rect' })
          .encode('x', 'stage')
          .encode('y', 'value')
          .style('fill', '#5B8FF9');
        break;
      }

      case 'gauge': {
        const gaugeData = [{ name: 'Progress', value: 70 }];

        chart
          .interval()
          .data(gaugeData)
          .transform({ type: 'stackY' })
          .coordinate({ type: 'theta', inner: 0.75, outer: 1 })
          .encode('y', 'value')
          .encode('color', 'name')
          .scale('y', { domain: [0, 100] })
          .axis(false)
          .legend(false)
          .style('fill', '#5B8FF9');

        chart
          .text()
          .data(gaugeData)
          .encode('text', 'value')
          .style('fontSize', 24)
          .style('textBaseline', 'middle')
          .style('textAlign', 'center')
          .style('fill', '#333')
          .style('dy', '-0.3em');

        chart
          .text()
          .data([{ name: 'Progress', value: 'KPI' }])
          .encode('text', 'value')
          .style('fontSize', 14)
          .style('textBaseline', 'middle')
          .style('textAlign', 'center')
          .style('fill', '#666')
          .style('dy', '0.8em');
        break;
      }
    }

    void chart.render();
    chartRef.current = chart;

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartType]);

  const chartButtons: { type: ChartType; label: string }[] = [
    { type: 'line', label: '折线图' },
    { type: 'bar', label: '柱状图' },
    { type: 'area', label: '面积图' },
    { type: 'pie', label: '饼图' },
    { type: 'donut', label: '环形图' },
    { type: 'scatter', label: '散点图' },
    { type: 'radar', label: '雷达图' },
    { type: 'heatmap', label: '热力图' },
    { type: 'funnel', label: '漏斗图' },
    { type: 'gauge', label: '仪表盘' }
  ];

  const getChartTitle = (type: ChartType): string => {
    const titles: Record<ChartType, string> = {
      line: '月度增长趋势',
      bar: '编程语言使用统计',
      area: '多系列面积图',
      pie: '开发领域分布',
      donut: '浏览器市场份额',
      scatter: '随机数据分布',
      radar: '框架能力评估',
      heatmap: '访问热力图',
      funnel: '转化漏斗',
      gauge: 'KPI 指标'
    };
    return titles[type];
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-4 flex flex-wrap gap-2">
        {chartButtons.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setChartType(type)}
            className={cn(
              'rounded px-3 py-1 text-sm transition-colors',
              chartType === type ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-border bg-card flex-1 overflow-hidden rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">{getChartTitle(chartType)}</h3>
        <div ref={containerRef} />
      </div>
    </div>
  );
};
