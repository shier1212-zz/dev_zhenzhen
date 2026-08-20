import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 开发期：/api 代理到 FastAPI（8000），前台 dev server 5173
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 仅绑定本机回环：规避 Windows 动态端口保留导致 0.0.0.0 绑定失败被误判为占用而顺延
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
