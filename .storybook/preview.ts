import { html } from "lit";
import "../custom_components/hass_datapoints/src/test-support/ha-stubs";

/**
 * HA dark-theme CSS custom properties.
 * These are normally set by Home Assistant at runtime on <html>.
 * We inject them here so Storybook previews look correct.
 */
const HA_DARK_THEME = `
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

const THEME_MAP: Record<string, string> = {
  "ha-dark": HA_DARK_THEME,
  "ha-light": HA_LIGHT_THEME,
};

const haThemeDecorator = (story: () => unknown, context: { globals?: { backgrounds?: { value?: string } } }) => {
  const bg = context?.globals?.backgrounds?.value || "#1c1c1c";
  const theme = bg === "#f5f5f5" ? HA_LIGHT_THEME : HA_DARK_THEME;
  return html`<div style="${theme} padding: 16px;">${story()}</div>`;
};

export const decorators = [haThemeDecorator];

export const parameters = {
  backgrounds: {
    default: "ha-dark",
    values: [
      { name: "ha-light", value: "#f5f5f5" },
      { name: "ha-dark", value: "#1c1c1c" },
    ],
  },

  a11y: {
    // 'todo' - show a11y violations in the test UI only
    // 'error' - fail CI on a11y violations
    // 'off' - skip a11y checks entirely
    test: "todo",
  },
};
