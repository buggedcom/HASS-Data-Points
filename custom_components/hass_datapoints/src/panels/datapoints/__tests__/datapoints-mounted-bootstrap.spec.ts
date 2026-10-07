import { describe, expect, it } from "vitest";
import {
  control,
  createHassFixture,
  createPanel,
  mountPanel,
  settlePanel,
  START,
  END,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a panel with a Home Assistant fixture", () => {
  describe("WHEN connected before its controls are ready", () => {
    it("THEN shows an accessible loading state followed by the shell", async () => {
      expect.assertions(5);
      const { hass } = createHassFixture();
      const panel = createPanel(hass);
      document.body.appendChild(panel);
      expect(
        panel.shadowRoot!.querySelector('[role="status"]')?.textContent
      ).toContain("Loading Datapoints");
      await settlePanel();
      const shell = control(panel.shadowRoot!, "panel-shell");
      expect(shell.hass).toBe(hass);
      expect(panel.shadowRoot!.querySelector('[role="status"]')).toBeNull();
      expect(
        control(panel.shadowRoot!, "range-toolbar").startTime?.toISOString()
      ).toBe(START);
      expect(
        control(panel.shadowRoot!, "range-toolbar").endTime?.toISOString()
      ).toBe(END);
    });
  });
  describe("WHEN no entities are configured", () => {
    it("THEN shows the empty selection prompt instead of a chart", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass, {});
      expect(
        panel.shadowRoot!.querySelector("#content")?.textContent
      ).toContain("Select one or more entities");
      expect(
        panel.shadowRoot!.querySelector("hass-datapoints-history-card")
      ).toBeNull();
    });
  });
  describe("WHEN a new hass object arrives after mounting", () => {
    it("THEN keeps the controls mounted and forwards the live states", async () => {
      expect.assertions(4);
      const { hass } = createHassFixture();
      const panel = await mountPanel(hass);
      const targets = control(panel.shadowRoot!, "history-targets");
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      const nextHass = {
        ...hass,
        states: {
          ...hass.states,
          "sensor.temperature": {
            ...hass.states["sensor.temperature"],
            state: "22",
          },
        },
      };
      panel.hass = nextHass;
      await settlePanel();
      expect(control(panel.shadowRoot!, "history-targets")).toBe(targets);
      expect(control(panel.shadowRoot!, "range-toolbar")).toBe(toolbar);
      expect(targets.states["sensor.temperature"].state).toBe("22");
      expect(toolbar.hass).toBe(nextHass);
    });
  });
});
