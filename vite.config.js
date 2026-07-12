import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base muss dem GitHub-Pages-Projektpfad entsprechen: https://<user>.github.io/daily-life-dash/
export default defineConfig({
  plugins: [react()],
  base: "/daily-life-dash/",
});
