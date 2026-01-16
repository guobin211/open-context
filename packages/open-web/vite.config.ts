import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [react(), tailwindcss()],
    clearScreen: false,
    resolve: {
        alias: {
            '@': '/src'
        }
    },
    server: {
        port: 1420,
        strictPort: true,
        host: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: 1421
        },
        watch: {
            ignored: ['**/src/**', '**/target/**', '**/icons/**', '**/gen/**', '**/capabilities/**']
        }
    }
}))
