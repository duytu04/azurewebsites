import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5152",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "web-build",
    emptyOutDir: true
  }
});
