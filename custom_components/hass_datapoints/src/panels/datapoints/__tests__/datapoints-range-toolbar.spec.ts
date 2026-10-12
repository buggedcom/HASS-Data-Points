import { describe, expect, it } from "vitest";
import {
  control,
  createHassFixture,
  mountPanel,
  settlePanel,
  START,
  END,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a toolbar showing the committed panel dates", () => {
  describe("WHEN the panel renders without changing the range", () => {
    it("THEN retains the toolbar date references", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      const start = toolbar.startTime;
      const end = toolbar.endTime;
      panel.requestUpdate();
      await panel.updateComplete;
      expect(toolbar.startTime).toBe(start);
      expect(toolbar.endTime).toBe(end);
    });
  });
});

describe("GIVEN a toolbar whose date props no longer match the panel selection", () => {
  describe("WHEN the panel renders its current state", () => {
    it("THEN restores the committed dates through the retained toolbar's bindings", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      toolbar.startTime = new Date("2025-01-01T00:00:00Z");
      toolbar.endTime = new Date("2025-01-02T00:00:00Z");
      panel.requestUpdate();
      await panel.updateComplete;
      await settlePanel();
      expect(control(panel.shadowRoot!, "range-toolbar")).toBe(toolbar);
      expect(toolbar.startTime?.toISOString()).toBe(START);
      expect(toolbar.endTime?.toISOString()).toBe(END);
    });
  });
});
