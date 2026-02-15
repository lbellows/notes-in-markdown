import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('@uiw/react-codemirror')) {
            return 'vendor-editor-react';
          }

          if (id.includes('@codemirror')) {
            return 'vendor-codemirror';
          }

          if (id.includes('@lezer')) {
            return 'vendor-lezer';
          }

          if (id.includes('react')) {
            return 'vendor-react';
          }

          if (
            id.includes('marked') ||
            id.includes('turndown') ||
            id.includes('dompurify')
          ) {
            return 'vendor-markdown';
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.{test,spec}.{js,jsx,mjs}'],
    exclude: ['tests/e2e/**']
  }
});
