import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import inspect from 'vite-plugin-inspect';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import preload from 'vite-plugin-preload';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __workspace = path.resolve(__dirname, '../../');

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    tanstackRouter({
      target: 'react',
      routeFileIgnorePattern: 'components|hooks|utils'
    }),
    tailwindcss(),
    codeInspectorPlugin({
      bundler: 'vite'
    }),
    react(),
    wasm(),
    topLevelAwait(),
    checker({
      typescript: true
    }),
    inspect(),
    preload()
  ],
  clearScreen: false,
  define: {
    __WORKSPACE__: JSON.stringify(__workspace)
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 6144,
    rollupOptions: {
      output: {
        manualChunks: {
          // 编辑器相关
          monaco: ['@monaco-editor/react', '@monaco-editor/loader', '@shikijs/monaco', 'shiki'],
          xterm: [
            '@xterm/xterm',
            '@xterm/addon-fit',
            '@xterm/addon-search',
            '@xterm/addon-web-links',
            '@xterm/addon-webgl',
            'xterm-theme'
          ],
          tiptap: [
            '@tiptap/core',
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extensions',
            '@tiptap/extension-highlight',
            '@tiptap/extension-horizontal-rule',
            '@tiptap/extension-image',
            '@tiptap/extension-list',
            '@tiptap/extension-subscript',
            '@tiptap/extension-superscript',
            '@tiptap/extension-text-align',
            '@tiptap/extension-typography'
          ],
          // 文档处理
          pdf: ['@react-pdf/renderer', 'react-pdf', 'pdfjs-dist', 'pdf-lib'],
          docx: ['docx', 'docx-preview'],
          xlsx: ['xlsx'],
          sheet: ['@fortune-sheet/react'],
          // Markdown 相关
          markdown: [
            'mermaid',
            'markdown-it',
            'markdown-it-abbr',
            'markdown-it-attributes',
            'markdown-it-container',
            'markdown-it-emoji',
            'markdown-it-github-alerts',
            'markdown-it-mark',
            'markdown-it-multimd-table',
            'markdown-it-sub',
            'markdown-it-sup',
            'react-markdown',
            'remark',
            'remark-gfm',
            'remark-mdx',
            'rehype-highlight',
            'front-matter'
          ],
          // Tauri 插件
          tauri: [
            '@tauri-apps/api',
            '@tauri-apps/plugin-autostart',
            '@tauri-apps/plugin-clipboard-manager',
            '@tauri-apps/plugin-dialog',
            '@tauri-apps/plugin-fs',
            '@tauri-apps/plugin-global-shortcut',
            '@tauri-apps/plugin-log',
            '@tauri-apps/plugin-opener',
            '@tauri-apps/plugin-os',
            '@tauri-apps/plugin-positioner',
            '@tauri-apps/plugin-process',
            '@tauri-apps/plugin-shell',
            '@tauri-apps/plugin-store',
            '@tauri-apps/plugin-updater',
            '@tauri-apps/plugin-upload',
            '@tauri-apps/plugin-window-state',
            'tauri-plugin-cache-api',
            'tauri-plugin-context-menu',
            'tauri-plugin-fs-pro-api',
            'tauri-plugin-macos-permissions-api',
            'tauri-plugin-screenshots-api',
            'tauri-remote-ui'
          ],
          // AWS/云存储
          aws: ['@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner', 'ali-oss', 'cos-js-sdk-v5'],
          // 拖拽相关
          dnd: ['@dnd-kit/core', '@dnd-kit/modifiers', '@dnd-kit/sortable']
        }
      }
    }
  },
  server: {
    port: 1420,
    strictPort: true,
    host: true,
    watch: {
      ignored: ['**/.tanstack/**', '**/dist/**', '**/public/**']
    }
  }
}));
