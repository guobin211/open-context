import { memo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import { cn } from '@/lib/utils';

export interface TiptapEditorProps {
  content?: string;
  editable?: boolean;
  className?: string;
  onChange?: (content: string) => void;
  onSave?: (content: string) => void;
}

/**
 * Tiptap 富文本编辑器组件
 */
export const TiptapEditor = memo(
  ({ content = '', editable = true, className, onChange, onSave }: TiptapEditorProps) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Image,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 hover:underline'
          }
        }),
        Highlight,
        Typography,
        TextAlign.configure({
          types: ['heading', 'paragraph']
        })
      ],
      content,
      editable,
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        onChange?.(html);
      },
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none focus:outline-none p-4'
        }
      }
    });

    const handleSave = useCallback(() => {
      if (editor && onSave) {
        const html = editor.getHTML();
        onSave(html);
      }
    }, [editor, onSave]);

    useCallback(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault();
          handleSave();
        }
      };

      if (editable) {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
      }
    }, [editable, handleSave]);

    if (!editor) {
      return (
        <div className={cn('flex h-full items-center justify-center bg-gray-50', className)}>
          <p className="text-sm text-gray-500">Loading editor...</p>
        </div>
      );
    }

    return (
      <div className={cn('h-full w-full overflow-auto bg-white', className)}>
        <EditorContent editor={editor} />
      </div>
    );
  }
);

TiptapEditor.displayName = 'TiptapEditor';
