import { LitElement } from "lit";
import { describe, expect, it, vi } from "vitest";
import { PANEL_HISTORY_LOADING_STYLE } from "../datapoints.styles";
import {
  control,
  createHassFixture,
  createPanel,
  mountPanel,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a panel mounted by Home Assistant properties", () => {
  describe("WHEN the shell finishes rendering", () => {
    it("THEN renders a LitElement scaffold inside its open shadow root", async () => {
      expect.assertions(4);
      const panel = await mountPanel(createHassFixture().hass);
      expect(panel).toBeInstanceOf(LitElement);
      expect(panel.shadowRoot?.mode).toBe("open");
      const shell = control(panel.shadowRoot!, "panel-shell");
      expect(
        shell.shadowRoot!.querySelector("ha-top-app-bar-fixed")
      ).not.toBeNull();
      expect(shell.querySelector("#content")).not.toBeNull();
    });
  });
});

describe("GIVEN a rendered Lit panel shell", () => {
  describe("WHEN Home Assistant changes narrow and panel configuration", () => {
    it("THEN updates the retained shell and controls from the public properties", async () => {
      expect.assertions(4);
      const panel = await mountPanel(createHassFixture().hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      window.sessionStorage.clear();
      window.history.replaceState(null, "", "/datapoints");
      panel.narrow = true;
      panel.panel = { config: { entities: ["sensor.humidity"] } };
      await panel.updateComplete;
      await settlePanel();
      expect(control(panel.shadowRoot!, "panel-shell")).toBe(shell);
      expect(shell.narrow).toBe(true);
      expect(
        control(panel.shadowRoot!, "history-targets").rows[0].entity_id
      ).toBe("sensor.humidity");
      expect(panel.getAttribute("narrow")).toBeNull();
    });
  });
});

describe("GIVEN the panel's loading style phase", () => {
  describe("WHEN HA components become ready", () => {
    it("THEN removes loading styles while retaining the Home Assistant theme stylesheet", async () => {
      expect.assertions(4);
      const panel = createPanel(createHassFixture().hass);
      document.body.appendChild(panel);
      const root = panel.shadowRoot!;
      expect(root.querySelector("style")?.textContent).toContain(
        PANEL_HISTORY_LOADING_STYLE.trim()
      );
      await vi.waitFor(() => control(root, "range-toolbar"));
      await settlePanel();
      expect(root.querySelector(".history-panel-loading")).toBeNull();
      expect(
        Array.from(root.querySelectorAll("style")).some((style) =>
          style.textContent?.includes(PANEL_HISTORY_LOADING_STYLE.trim())
        )
      ).toBe(false);
      expect(
        root.adoptedStyleSheets
          .flatMap((sheet) => Array.from(sheet.cssRules))
          .map((rule) => rule.cssText)
          .join("\n")
      ).toContain("--dp-spacing-xs");
    });
  });
});

describe("GIVEN a device with one registered sensor", () => {
  describe("WHEN HA adds another sensor and selects the device in the same update", () => {
    it("THEN resolves all device sensors from the latest HA registry", async () => {
      expect.assertions(1);
      const { hass } = createHassFixture();
      hass.entities = {
        "sensor.temperature": {
          entity_id: "sensor.temperature",
          device_id: "device-one",
          area_id: null,
          labels: [],
        },
      };
      const panel = await mountPanel(hass);
      window.sessionStorage.clear();
      window.history.replaceState(null, "", "/datapoints");
      panel.hass = {
        ...hass,
        entities: {
          ...hass.entities,
          "sensor.humidity": {
            entity_id: "sensor.humidity",
            device_id: "device-one",
            area_id: null,
            labels: [],
          },
        },
      };
      panel.panel = { config: { target: { device_id: ["device-one"] } } };
      await panel.updateComplete;
      await settlePanel();
      expect(
        control(panel.shadowRoot!, "history-targets").rows.map(
          (row) => row.entity_id
        )
      ).toEqual(["sensor.temperature", "sensor.humidity"]);
    });
  });
});
