import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  initialValue?: string;
  initialLanguage?: string;
  className?: string;
}

const LANGUAGES = [
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'json', label: 'JSON' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' }
];

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

export const MonacoEditor = ({ initialValue, initialLanguage = 'typescript', className }: MonacoEditorProps) => {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialValue || DEFAULT_CODE[initialLanguage] || '');

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(DEFAULT_CODE[newLanguage] || '');
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div className="border-border flex items-center gap-2 border-b p-2">
        <span className="text-muted-foreground text-sm">语言：</span>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="border-border bg-background focus:ring-primary rounded border px-3 py-1 text-sm focus:ring-2 focus:outline-none"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            rulers: [80, 120],
            tabSize: 2,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </div>
    </div>
  );
};
