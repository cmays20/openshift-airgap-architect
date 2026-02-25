import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800
  },
  server: {
    host: true,
    port: 5173
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: ["src/**/*.{test,spec}.{js,jsx}", "tests/**/*.{test,spec}.{js,jsx}"]
  }
});
