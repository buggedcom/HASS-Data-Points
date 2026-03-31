import "../custom_components/hass_datapoints/src/test-support/ha-stubs";

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
