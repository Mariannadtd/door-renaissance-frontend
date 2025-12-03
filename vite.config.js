import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import legacy from "@vitejs/plugin-legacy";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: "/",
  plugins: [
    vue(),
    legacy({
      targets: [
        "defaults",
        "not IE 11",
        "ios >= 12",
        "android >= 6",
        "Safari >= 11",
      ],
      modernPolyfills: true,
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
      renderLegacyChunks: true,
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    target: "es2015",
    modulePreload: { polyfill: true },
    cssTarget: "ios12",
  },
});
