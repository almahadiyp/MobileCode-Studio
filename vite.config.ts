import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror/state') || id.includes('@codemirror/view') || id.includes('@codemirror/commands') || id.includes('@codemirror/language') || id.includes('@codemirror/autocomplete') || id.includes('@codemirror/search') || id.includes('@codemirror/lint')) {
              return 'codemirror';
            }
            if (id.includes('@codemirror/lang-') || id.includes('@lezer/highlight')) {
              return 'codemirror-lang';
            }
            if (id.includes('@capacitor/core') || id.includes('@capacitor/filesystem') || id.includes('@capacitor/device')) {
              return 'capacitor';
            }
          }
        },
      },
    },
  },
});
