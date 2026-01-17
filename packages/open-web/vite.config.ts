import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { codeInspectorPlugin } from 'code-inspector-plugin';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    tanstackRouter({
      target: 'react'
    }),
    tailwindcss(),
    codeInspectorPlugin({
      bundler: 'vite'
    }),
    react()
  ],
  clearScreen: false,
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    target: 'es2018',
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
