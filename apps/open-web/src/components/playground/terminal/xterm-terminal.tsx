import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { cn } from '@/lib/utils';

interface XtermTerminalProps {
  className?: string;
}

export const XtermTerminal = ({ className }: XtermTerminalProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        cursorAccent: '#000000',
        selectionBackground: '#264f78',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5'
      }
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);

    fitAddon.fit();

    terminal.writeln('Welcome to Open Context Terminal!');
    terminal.writeln('This is a demo terminal with limited functionality.');
    terminal.writeln('');
    terminal.write('$ ');

    let currentLine = '';
    let commandHistory: string[] = [];
    let historyIndex = -1;

    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) {
        terminal.writeln('');
        if (currentLine.trim()) {
          commandHistory.push(currentLine);
          historyIndex = commandHistory.length;
          handleCommand(currentLine, terminal);
        }
        currentLine = '';
        terminal.write('$ ');
      } else if (code === 127) {
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          terminal.write('\b \b');
        }
      } else if (code === 27) {
        const seq = data.substring(1);
        if (seq === '[A') {
          if (historyIndex > 0) {
            terminal.write('\r\x1b[K$ ');
            historyIndex--;
            currentLine = commandHistory[historyIndex];
            terminal.write(currentLine);
          }
        } else if (seq === '[B') {
          terminal.write('\r\x1b[K$ ');
          if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            currentLine = commandHistory[historyIndex];
          } else {
            historyIndex = commandHistory.length;
            currentLine = '';
          }
          terminal.write(currentLine);
        }
      } else if (code >= 32 && code <= 126) {
        currentLine += data;
        terminal.write(data);
      }
    });

    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);
    terminalInstance.current = terminal;

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, []);

  return <div ref={terminalRef} className={cn('h-full w-full', className)} />;
};

function handleCommand(command: string, terminal: Terminal) {
  const cmd = command.trim().toLowerCase();

  if (cmd === 'help') {
    terminal.writeln('Available commands:');
    terminal.writeln('  help    - Show this help message');
    terminal.writeln('  clear   - Clear the terminal');
    terminal.writeln('  echo    - Echo text');
    terminal.writeln('  date    - Show current date and time');
    terminal.writeln('  whoami  - Show current user');
    terminal.writeln('  pwd     - Show current directory');
    terminal.writeln('  ls      - List files (demo)');
  } else if (cmd === 'clear') {
    terminal.clear();
  } else if (cmd.startsWith('echo ')) {
    terminal.writeln(command.substring(5));
  } else if (cmd === 'date') {
    terminal.writeln(new Date().toString());
  } else if (cmd === 'whoami') {
    terminal.writeln('demo-user');
  } else if (cmd === 'pwd') {
    terminal.writeln('/home/demo-user/playground');
  } else if (cmd === 'ls') {
    terminal.writeln('file1.txt  file2.txt  folder1/  folder2/');
  } else if (cmd === '') {
  } else {
    terminal.writeln(`Command not found: ${cmd}`);
    terminal.writeln('Type "help" for available commands');
  }
}
