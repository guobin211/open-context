import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { cn } from '@/lib/utils';

export type MonacoEditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'html'
  | 'css'
  | 'json'
  | 'xml'
  | 'yaml'
  | 'sql'
  | 'shell'
  | 'plaintext';

export interface MonacoEditorProps {
  value?: string;
  language?: MonacoEditorLanguage;
  readOnly?: boolean;
  theme?: 'vs' | 'vs-dark' | 'hc-black';
  className?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
}

/**
 * Monaco Editor 代码编辑器组件
 */
export const MonacoEditor = memo(
  ({
    value = '',
    language = 'plaintext',
    readOnly = false,
    theme = 'vs',
    className,
    onChange,
    onSave
  }: MonacoEditorProps) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const [mounted, setMounted] = useState(false);

    const handleEditorDidMount = useCallback(
      (editor: editor.IStandaloneCodeEditor) => {
        editorRef.current = editor;

        if (onSave) {
          editor.addCommand(2097 | 1024, () => {
            const currentValue = editor.getValue();
            onSave(currentValue);
          });
        }
      },
      [onSave]
    );

    const handleEditorChange = useCallback(
      (value: string | undefined) => {
        if (value !== undefined && onChange) {
          onChange(value);
        }
      },
      [onChange]
    );

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return (
        <div className={cn('flex h-full items-center justify-center bg-gray-50', className)}>
          <p className="text-sm text-gray-500">Loading editor...</p>
        </div>
      );
    }

    return (
      <div className={cn('h-full w-full', className)}>
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          options={{
            readOnly,
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            formatOnType: true
          }}
          onMount={handleEditorDidMount}
          onChange={handleEditorChange}
        />
      </div>
    );
  }
);

MonacoEditor.displayName = 'MonacoEditor';

/**
 * 根据文件扩展名推断 Monaco Editor 语言
 */
export function inferMonacoLanguage(filePath: string): MonacoEditorLanguage {
  const ext = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, MonacoEditorLanguage> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    c: 'cpp',
    h: 'cpp',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'css',
    sass: 'css',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    sql: 'sql',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    txt: 'plaintext'
  };

  return ext && languageMap[ext] ? languageMap[ext] : 'plaintext';
}
