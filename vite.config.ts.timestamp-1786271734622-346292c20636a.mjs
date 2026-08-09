// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    minify: "esbuild",
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          "codemirror": [
            "@codemirror/state",
            "@codemirror/view",
            "@codemirror/commands",
            "@codemirror/language",
            "@codemirror/autocomplete",
            "@codemirror/search",
            "@codemirror/lint"
          ],
          "codemirror-lang": [
            "@codemirror/lang-javascript",
            "@codemirror/lang-css",
            "@codemirror/lang-html",
            "@codemirror/lang-json",
            "@codemirror/lang-markdown",
            "@codemirror/lang-python",
            "@codemirror/lang-java",
            "@codemirror/lang-cpp",
            "@codemirror/lang-rust",
            "@codemirror/lang-sql",
            "@codemirror/lang-xml",
            "@codemirror/lang-yaml",
            "@codemirror/lang-php",
            "@lezer/highlight"
          ],
          "capacitor": [
            "@capacitor/core",
            "@capacitor/filesystem",
            "@capacitor/device"
          ]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgfSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICBtaW5pZnk6ICdlc2J1aWxkJyxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTUwMCxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgJ2NvZGVtaXJyb3InOiBbXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3Ivc3RhdGUnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL3ZpZXcnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2NvbW1hbmRzJyxcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9sYW5ndWFnZScsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvYXV0b2NvbXBsZXRlJyxcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9zZWFyY2gnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xpbnQnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgJ2NvZGVtaXJyb3ItbGFuZyc6IFtcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9sYW5nLWphdmFzY3JpcHQnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmctY3NzJyxcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9sYW5nLWh0bWwnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmctanNvbicsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvbGFuZy1tYXJrZG93bicsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvbGFuZy1weXRob24nLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmctamF2YScsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvbGFuZy1jcHAnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmctcnVzdCcsXG4gICAgICAgICAgICAnQGNvZGVtaXJyb3IvbGFuZy1zcWwnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmcteG1sJyxcbiAgICAgICAgICAgICdAY29kZW1pcnJvci9sYW5nLXlhbWwnLFxuICAgICAgICAgICAgJ0Bjb2RlbWlycm9yL2xhbmctcGhwJyxcbiAgICAgICAgICAgICdAbGV6ZXIvaGlnaGxpZ2h0JyxcbiAgICAgICAgICBdLFxuICAgICAgICAgICdjYXBhY2l0b3InOiBbXG4gICAgICAgICAgICAnQGNhcGFjaXRvci9jb3JlJyxcbiAgICAgICAgICAgICdAY2FwYWNpdG9yL2ZpbGVzeXN0ZW0nLFxuICAgICAgICAgICAgJ0BjYXBhY2l0b3IvZGV2aWNlJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWUsV0FBVztBQUYrRixJQUFNLDJDQUEyQztBQUtuTCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxjQUFjO0FBQUEsRUFDMUI7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGNBQWM7QUFBQSxJQUNkLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLHVCQUF1QjtBQUFBLElBQ3ZCLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLGNBQWM7QUFBQSxZQUNaO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsbUJBQW1CO0FBQUEsWUFDakI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsYUFBYTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
