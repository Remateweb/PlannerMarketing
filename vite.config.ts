import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ✅ usa "/" porque o projeto está na raiz da branch publicada
export default defineConfig({
  plugins: [react()],
  base: "/",
});
