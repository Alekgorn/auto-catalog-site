import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

/** Отдельная сборка приложения для Node — из неё генератор берёт HTML страниц. */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    ssr: 'src/entry-prerender.tsx',
    outDir: 'dist-prerender',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      output: { format: 'esm', entryFileNames: 'entry.mjs' },
    },
  },
});
