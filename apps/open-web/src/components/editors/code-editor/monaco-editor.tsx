import { useState } from 'react';
import { MonacoEditor as CoreMonacoEditor, MonacoEditorLanguage } from '@/components/core/file-editor/monaco-editor';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  initialValue?: string;
  initialLanguage?: MonacoEditorLanguage;
  className?: string;
}

const DEFAULT_CODE: Record<string, string> = {
  typescript: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
  javascript: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));`,
  python: `def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`,
  rust: `fn main() {
    let name = "World";
    println!("Hello, {}!", name);
}`,
  go: `package main

import "fmt"

func main() {
    name := "World"
    fmt.Printf("Hello, %s!\\n", name)
}`
};

/**
 * 带语言选择器的代码编辑器组件
 * 基于核心 MonacoEditor 组件封装
 */
export const MonacoEditor = ({ initialValue, initialLanguage = 'typescript', className }: MonacoEditorProps) => {
  const [language, setLanguage] = useState<MonacoEditorLanguage>(initialLanguage);
  const [code, setCode] = useState(initialValue || DEFAULT_CODE[initialLanguage] || '');

  const handleLanguageChange = (newLanguage: MonacoEditorLanguage) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || '');
  };

  return (
    <CoreMonacoEditor
      value={code}
      language={language}
      theme="vs-dark"
      className={cn('h-full', className)}
      showLanguageSelector={true}
      onChange={(value) => setCode(value)}
      onLanguageChange={handleLanguageChange}
    />
  );
};
