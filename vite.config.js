import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Ensure /complete route is handled by the SPA
  server: { historyApiFallback: true },
});
