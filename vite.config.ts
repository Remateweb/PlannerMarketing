import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ⚠️ o base DEVE bater exatamente com o nome do repositório
export default defineConfig({
  plugins: [react()],
  base: "/PlannerMarketing/",
});
