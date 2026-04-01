import { html } from "lit";
import "../custom_components/hass_datapoints/src/test-support/ha-stubs";

/**
 * HA dark-theme CSS custom properties.
 * These are normally set by Home Assistant at runtime on <html>.
 * We inject them here so Storybook previews look correct.
 */
const HA_DARK_THEME = `
  --dark-theme: true;
  --primary-text-color: #e1e1e1;
  --secondary-text-color: #9e9e9e;
  --text-primary-color: #fff;
  --primary-color: #03a9f4;
  --accent-color: #ff9800;
  --divider-color: rgba(255, 255, 255, 0.12);
  --card-background-color: #1c1c1c;
  --primary-background-color: #111;
  --secondary-background-color: #1c1c1c;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --success-color: #4caf50;
  --info-color: #2196f3;
  --disabled-text-color: #6f6f6f;
  --spacing: 8px;
  --ha-card-border-radius: 12px;
  --ha-card-border-color: rgba(255, 255, 255, 0.12);
  --input-outlined-idle-border-color: rgba(255, 255, 255, 0.24);
  --mdc-theme-primary: #03a9f4;
  --mdc-icon-size: 24px;
  --icon-primary-color: var(--primary-text-color);
  color: var(--primary-text-color);
  font-family: Roboto, Noto, sans-serif;
  font-size: 14px;
`;

const HA_LIGHT_THEME = `
  --light-theme: true;
  --primary-text-color: #212121;
  --secondary-text-color: #727272;
  --text-primary-color: #fff;
  --primary-color: #03a9f4;
  --accent-color: #ff9800;
  --divider-color: rgba(0, 0, 0, 0.12);
  --card-background-color: #fff;
  --primary-background-color: #f5f5f5;
  --secondary-background-color: #e8e8e8;
  --error-color: #f44336;
  --warning-color: #ff9800;
  --success-color: #4caf50;
  --info-color: #2196f3;
  --disabled-text-color: #bdbdbd;
  --spacing: 8px;
  --ha-card-border-radius: 12px;
  --ha-card-border-color: rgba(0, 0, 0, 0.12);
  --input-outlined-idle-border-color: rgba(0, 0, 0, 0.38);
  --mdc-theme-primary: #03a9f4;
  --mdc-icon-size: 24px;
  --icon-primary-color: var(--primary-text-color);
  color: var(--primary-text-color);
  font-family: Roboto, Noto, sans-serif;
  font-size: 14px;
`;

/**
 * Adds an explicit HA theme toolbar to Storybook.
 * Using a dedicated global avoids relying on the backgrounds addon value,
 * which is unreliable across Storybook versions.
 */
export const globalTypes = {
  haTheme: {
    description: "Home Assistant theme",
    defaultValue: "dark",
    toolbar: {
      title: "HA Theme",
      icon: "paintbrush",
      items: [
        { value: "dark", title: "HA Dark", right: "🌙" },
        { value: "light", title: "HA Light", right: "☀️" },
      ],
      dynamicTitle: true,
    },
  },
};

const haThemeDecorator = (story: () => unknown, context: { globals?: { haTheme?: string } }) => {
  const isLight = context?.globals?.haTheme === "light";
  const theme = isLight ? HA_LIGHT_THEME : HA_DARK_THEME;
  const pageBg = isLight ? "#f5f5f5" : "#111111";
  return html`
    <div style="min-height: 100vh; background: ${pageBg}; padding: 16px; box-sizing: border-box;">
      <div style="${theme}">${story()}</div>
    </div>
  `;
};

export const decorators = [haThemeDecorator];

export const parameters = {
  backgrounds: { disable: true },

  a11y: {
    // 'todo' - show a11y violations in the test UI only
    // 'error' - fail CI on a11y violations
    // 'off' - skip a11y checks entirely
    test: "todo",
  },
};
