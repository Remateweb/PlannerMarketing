import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚠️ use o nome EXATO do repositório entre barras
export default defineConfig({
  plugins: [react()],
  base: "/PlannerMarketing/",
  build: {
    outDir: "dist",
  },
});
