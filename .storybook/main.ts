import type { StorybookConfig } from "@storybook/web-components-vite";

const config: StorybookConfig = {
  stories: ["../custom_components/hass_datapoints/src/**/*.stories.ts"],
  framework: "@storybook/web-components-vite",
  addons: [
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
    "@chromatic-com/storybook",
    "@storybook/test",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
};

export default config;
