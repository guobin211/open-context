import { useDocumentStore } from '../../storage/document-store';
import { DocumentTitle } from './document-title';
import { CodeBlock } from './code-block';
import { JSX } from 'react';

export function DocumentView() {
  const { currentDocument } = useDocumentStore();

  if (!currentDocument) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        <p>选择一个文档开始</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <DocumentTitle title={currentDocument.title} />
      <DocumentContent content={currentDocument.content} />
    </div>
  );
}

interface DocumentContentProps {
  content: {
    type?: string;
    content?: DocumentContentProps['content'][];
    text?: string;
    marks?: { type: string; attrs?: Record<string, string> }[];
    attrs?: Record<string, string | number>;
  };
}

function DocumentContent({ content }: DocumentContentProps) {
  if (!content.content) return null;

  return (
    <div className="prose prose-gray max-w-none">
      {content.content.map((node, index) => (
        <RenderNode key={index} node={node} />
      ))}
    </div>
  );
}

interface RenderNodeProps {
  node: DocumentContentProps['content'];
}

function RenderNode({ node }: RenderNodeProps) {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="mb-4 leading-relaxed text-gray-700">
          {node.content?.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </p>
      );

    case 'heading':
      const level = node.attrs?.level || 2;
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      return (
        <HeadingTag className="mt-8 mb-4 font-semibold text-gray-900">
          {node.content?.map((child, i) => (
            <RenderInline key={i} node={child} />
          ))}
        </HeadingTag>
      );

    case 'image':
      return (
        <figure className="my-6">
          <img
            src={node.attrs?.src as string}
            alt={node.attrs?.alt as string}
            className="w-full rounded-lg shadow-md"
          />
          {node.attrs?.title && (
            <figcaption className="mt-2 text-center text-sm text-gray-500">{node.attrs.title}</figcaption>
          )}
        </figure>
      );

    case 'codeBlock':
      const codeText = node.content?.[0]?.text || '';
      const title =
        (node.attrs?.title as string) || `${(node.attrs?.language as string)?.toUpperCase() || 'CODE'} SDK 示例`;
      return <CodeBlock code={codeText} language={node.attrs?.language as string} title={title} />;

    default:
      return null;
  }
}

function RenderInline({ node }: RenderNodeProps) {
  if (node.type === 'text') {
    let content: React.ReactNode = node.text;

    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === 'link') {
          content = (
            <a href={mark.attrs?.href} className="text-red-500 hover:underline">
              {content}
            </a>
          );
        }
        if (mark.type === 'bold') {
          content = <strong>{content}</strong>;
        }
        if (mark.type === 'italic') {
          content = <em>{content}</em>;
        }
        if (mark.type === 'code') {
          content = <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">{content}</code>;
        }
      }
    }

    return <>{content}</>;
  }

  return null;
}
