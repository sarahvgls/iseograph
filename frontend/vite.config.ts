// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
//
// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// });

import react from "@vitejs/plugin-react";
import { defineConfig as defineViteConfig, mergeConfig } from "vite";
import svgr from "vite-plugin-svgr";
import { defineConfig as defineVitestConfig } from "vitest/config";

// https://vite.dev/config/
const viteConfig = defineViteConfig({
  base: "/static/",
  plugins: [react({}), svgr()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000", // Backend Django server
        changeOrigin: true,
        secure: false, // Needed if backend runs on HTTP
        cookieDomainRewrite: "localhost", // Ensures CSRF cookies work correctly
      },
    },
  },
});

const vitestConfig = defineVitestConfig({
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});

export default mergeConfig(viteConfig, vitestConfig);
