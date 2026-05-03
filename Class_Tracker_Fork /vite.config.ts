import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@types": "/src/types",
      "@engine": "/src/engine",
      "@storage": "/src/storage",
      "@hooks": "/src/hooks",
      "@components": "/src/components",
      "@themes": "/src/themes",
      "@data": "/src/data",
    },
  },
});
