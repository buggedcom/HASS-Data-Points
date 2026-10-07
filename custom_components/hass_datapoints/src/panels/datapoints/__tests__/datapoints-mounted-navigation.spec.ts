import { describe, expect, it } from "vitest";
import { PANEL_HISTORY_SESSION_KEY } from "@/lib/history-page/history-session-state";
import {
  control,
  createHassFixture,
  emitControlEvent,
  END,
  lastSavedValue,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  START,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN a mounted panel with URL state", () => {
  describe("WHEN browser navigation changes the entity and range", () => {
    it("THEN updates the targets, toolbar and chart from the location", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const params = new URLSearchParams({
        entity_id: "sensor.humidity",
        start_time: "2025-01-08T00:00:00.000Z",
        end_time: "2025-01-09T00:00:00.000Z",
      });
      window.history.pushState(null, "", `/datapoints?${params}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
      await settlePanel();
      expect(
        control(panel.shadowRoot!, "history-targets").rows[0].entity_id
      ).toBe("sensor.humidity");
      expect(
        control(panel.shadowRoot!, "range-toolbar").startTime?.toISOString()
      ).toBe("2025-01-08T00:00:00.000Z");
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.entities
      ).toEqual(["sensor.humidity"]);
    });
  });
});

describe("GIVEN persisted panel state in session storage", () => {
  describe("WHEN the panel is mounted without explicit URL targets", () => {
    it("THEN restores its series and collapsed sidebar", async () => {
      expect.assertions(3);
      window.sessionStorage.setItem(
        PANEL_HISTORY_SESSION_KEY,
        JSON.stringify({
          entities: ["sensor.humidity"],
          sidebar_collapsed: true,
          start_time: START,
          end_time: END,
        })
      );
      const panel = await mountPanel(createHassFixture().hass, {});
      expect(
        control(panel.shadowRoot!, "history-targets").rows[0].entity_id
      ).toBe("sensor.humidity");
      expect(control(panel.shadowRoot!, "panel-shell").sidebarCollapsed).toBe(
        true
      );
      expect(
        control(panel.shadowRoot!, "range-toolbar").startTime?.toISOString()
      ).toBe(START);
    });
  });
});

describe("GIVEN user preferences returned by Home Assistant", () => {
  describe("WHEN the panel bootstraps", () => {
    it("THEN applies saved range preferences and series colors", async () => {
      expect.assertions(3);
      const { hass } = createHassFixture({
        preferences: {
          zoom_level: "day",
          date_snapping: "day",
          series_colors: { "sensor.temperature": "#123456" },
        },
      });
      const panel = await mountPanel(hass);
      expect(control(panel.shadowRoot!, "range-toolbar").zoomLevel).toBe("day");
      expect(control(panel.shadowRoot!, "range-toolbar").dateSnapping).toBe(
        "day"
      );
      expect(control(panel.shadowRoot!, "history-targets").rows[0].color).toBe(
        "#123456"
      );
    });
  });
});

describe("GIVEN a mounted panel's page menu", () => {
  describe("WHEN the user saves page state", () => {
    it("THEN writes a reusable page snapshot and offers restore", async () => {
      expect.assertions(3);
      const { hass, sendMessagePromise } = createHassFixture();
      const panel = await mountPanel(hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      emitControlEvent(shell, "dp-shell-sidebar-toggle");
      emitControlEvent(shell, "dp-shell-menu-save");
      await settlePanel();
      expect(lastSavedValue(sendMessagePromise)).toMatchObject({
        entities: ["sensor.temperature"],
        sidebar_collapsed: true,
        start_time: START,
        end_time: END,
      });
      expect(
        JSON.parse(window.sessionStorage.getItem(PANEL_HISTORY_SESSION_KEY)!)
      ).toMatchObject({ sidebar_collapsed: true });
      expect(shell.hasSavedState).toBe(true);
    });
  });
});
