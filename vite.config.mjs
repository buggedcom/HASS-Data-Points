import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, "custom_components/hass_datapoints/src/register.js"),
      formats: ["iife"],
      name: "HassDatapointsFrontend",
      fileName: () => "hass-datapoints-cards.js",
    },
    minify: false,
    outDir: resolve(__dirname, "custom_components/hass_datapoints"),
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    sourcemap: false,
    target: "es2022",
  },
});
