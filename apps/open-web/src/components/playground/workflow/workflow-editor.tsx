import { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { cn } from '@/lib/utils';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '开始' },
    position: { x: 250, y: 25 }
  },
  {
    id: '2',
    data: { label: '处理数据' },
    position: { x: 100, y: 125 }
  },
  {
    id: '3',
    data: { label: '验证结果' },
    position: { x: 400, y: 125 }
  },
  {
    id: '4',
    type: 'output',
    data: { label: '结束' },
    position: { x: 250, y: 225 }
  }
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-4', source: '3', target: '4' }
];

interface WorkflowEditorProps {
  className?: string;
}

export const WorkflowEditor = ({ className }: WorkflowEditorProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeId, setNodeId] = useState(5);

  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const addNode = () => {
    const newNode: Node = {
      id: nodeId.toString(),
      data: { label: `节点 ${nodeId}` },
      position: {
        x: Math.random() * 500,
        y: Math.random() * 300
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setNodeId((id) => id + 1);
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="mb-4 flex gap-2">
        <button
          onClick={addNode}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-sm transition-colors"
        >
          添加节点
        </button>
        <button
          onClick={() => {
            setNodes(initialNodes);
            setEdges(initialEdges);
            setNodeId(5);
          }}
          className="border-border hover:bg-accent rounded border px-3 py-1 text-sm transition-colors"
        >
          重置
        </button>
      </div>

      <div className="border-border bg-card flex-1 rounded-lg border">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>

      <div className="border-border bg-card mt-4 rounded-lg border p-4">
        <h3 className="mb-2 text-sm font-semibold">使用说明</h3>
        <ul className="text-muted-foreground space-y-1 text-sm">
          <li>• 拖拽节点改变位置</li>
          <li>• 从节点边缘拖拽连接其他节点</li>
          <li>• 点击「添加节点」创建新节点</li>
          <li>• 选中节点或连线后按 Delete 键删除</li>
        </ul>
      </div>
    </div>
  );
};
