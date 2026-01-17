import { create } from 'zustand';
import type { JSONContent } from '@tiptap/react';

export interface Document {
  id: string;
  title: string;
  content: JSONContent;
  path: string[];
  updatedAt: Date;
}

interface DocumentState {
  currentDocument: Document | null;
  syncStatus: 'synced' | 'syncing' | 'error';
  setDocument: (doc: Document) => void;
  setSyncStatus: (status: 'synced' | 'syncing' | 'error') => void;
}

// Mock 文档数据
export const mockDocument: Document = {
  id: 'claude',
  title: 'Agent SDK 概览',
  path: ['agent', 'claude'],
  updatedAt: new Date(),
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Agent SDK 是一个功能强大的库，旨在帮助开发者快速构建和部署与 Claude AI 模型深度集成的智能体。要详细了解如何开始，请参阅 '
          },
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: '#' } }],
            text: '迁移指南'
          },
          {
            type: 'text',
            text: '。'
          }
        ]
      },
      {
        type: 'image',
        attrs: {
          src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          alt: 'OpenContext 视觉设计概念',
          title: '示例图片：OpenContext 视觉设计概念'
        }
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'PYTHON SDK 示例' }]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'python' },
        content: [
          {
            type: 'text',
            text: `from anthropic import Anthropic

client = Anthropic()

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude"}
    ]
)
print(message.content)`
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '核心特性' }]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Agent SDK 提供了一系列强大的功能，帮助开发者构建智能应用：'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '1. 流式响应支持：实时接收 AI 生成的内容，提供更好的用户体验。'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '2. 工具调用：允许 AI 调用外部工具和 API，扩展其能力边界。'
          }
        ]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '3. 多轮对话：维护对话上下文，支持复杂的交互场景。'
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'TypeScript SDK 示例' }]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'typescript' },
        content: [
          {
            type: 'text',
            text: `import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

async function main() {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: 'Hello, Claude' }
    ]
  });
  
  console.log(message.content);
}

main();`
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '安装指南' }]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '使用您喜欢的包管理器安装 SDK：'
          }
        ]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'bash' },
        content: [
          {
            type: 'text',
            text: `# Python
pip install anthropic

# Node.js
npm install @anthropic-ai/sdk

# 或使用 pnpm
pnpm add @anthropic-ai/sdk`
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '更多资源' }]
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '访问我们的官方文档了解更多高级用法和最佳实践。我们还提供了丰富的示例代码和教程，帮助您快速上手。'
          }
        ]
      }
    ]
  }
};

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDocument: null,
  syncStatus: 'synced',
  setDocument: (doc: Document) => set({ currentDocument: doc }),
  setSyncStatus: (status) => set({ syncStatus: status })
}));
