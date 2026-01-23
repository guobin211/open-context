import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import inspect from 'vite-plugin-inspect';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

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
    inspect()
  ],
  clearScreen: false,
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2048
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
