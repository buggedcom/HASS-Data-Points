/// <reference types="vitest/config" />
import { resolve } from "node:path";
import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(dirname, "custom_components/hass_datapoints/src"),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(
        __dirname,
        "custom_components/hass_datapoints/src/register.js"
      ),
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
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "happy-dom",
          include: ["custom_components/hass_datapoints/src/**/*.spec.ts"],
          setupFiles: [
            "custom_components/hass_datapoints/src/test-support/setup.ts",
          ],
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: "playwright",
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
