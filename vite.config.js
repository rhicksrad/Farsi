import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset URLs work both locally and under /Farsi/ on GitHub Pages.
  base: "./",
  build: {
    chunkSizeWarningLimit: 650,
  },
});
