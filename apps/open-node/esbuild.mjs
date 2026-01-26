import { rm } from 'node:fs/promises';
import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __workspace = path.resolve(__dirname, '../../');
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

const isDev = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['./src/app.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: './dist/index.js',
  external: Object.keys(pkg.dependencies || {}),
  sourcemap: !isDev,
  minify: false,
  keepNames: true,
  treeShaking: true,
  legalComments: 'none',
  logLevel: 'info'
};

console.log('Cleaning dist directory...');
await rm('dist', { recursive: true, force: true });

console.log(isDev ? 'Building in watch mode...' : 'Building for production...');

const context = await esbuild.context({
  ...baseConfig,
  define: {
    __WORKSPACE__: JSON.stringify(__workspace)
  }
});

if (isDev) {
  console.log('👀 Watching for changes...');
  await context.watch();
  console.log('✅ Watch mode enabled. Press Ctrl+C to stop.');
} else {
  console.log('📦 Building...');
  await context.rebuild();
  console.log('✅ Build completed successfully!');
  console.log('ES模块版本: dist/esm/index.js');
  await context.dispose();
  console.log('🎉 Build completed!');
}
