import { describe, expect, it } from "vitest";
import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a mounted panel's AI query brief", () => {
  describe("WHEN an admin opens the brief from the page menu", () => {
    it("THEN includes the selected series and monitor context and can be closed", async () => {
      expect.assertions(4);
      const { hass, sendMessagePromise } = createHassFixture({ admin: true });
      const panel = await mountPanel(hass);
      emitControlEvent(
        control(panel.shadowRoot!, "panel-shell"),
        "dp-shell-menu-ai-brief"
      );
      await settlePanel();
      const dialog = control(panel.shadowRoot!, "ai-query-brief-dialog");
      expect(dialog.open).toBe(true);
      expect(dialog.text).toContain("sensor.temperature");
      expect(sendMessagePromise).toHaveBeenCalledWith({
        type: "hass_datapoints/monitors/list",
      });
      emitControlEvent(dialog, "dp-ai-query-brief-close");
      await settlePanel();
      expect(dialog.open).toBe(false);
    });
  });
  describe("WHEN a non-admin opens the brief", () => {
    it("THEN explains the omitted monitor context without requesting admin data", async () => {
      expect.assertions(2);
      const { hass, sendMessagePromise } = createHassFixture();
      const panel = await mountPanel(hass);
      emitControlEvent(
        control(panel.shadowRoot!, "panel-shell"),
        "dp-shell-menu-ai-brief"
      );
      await settlePanel();
      expect(
        control(panel.shadowRoot!, "ai-query-brief-dialog").text
      ).toContain("not an admin");
      expect(sendMessagePromise).not.toHaveBeenCalledWith({
        type: "hass_datapoints/monitors/list",
      });
    });
  });
});
