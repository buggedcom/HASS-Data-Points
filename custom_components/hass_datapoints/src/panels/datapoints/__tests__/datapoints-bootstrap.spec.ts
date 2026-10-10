import { describe, expect, it } from "vitest";
import {
  PANEL_HISTORY_SESSION_KEY,
  PANEL_HISTORY_PREFERENCES_KEY,
} from "@/lib/history-page/history-session-state";
import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  settlePanel,
  START,
  END,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN restored session state and a saved page", () => {
  describe("WHEN the shell finishes mounting", () => {
    it("THEN fetches preferences and bounds, offers restore, and restores URL state", async () => {
      expect.assertions(4);
      window.sessionStorage.setItem(
        PANEL_HISTORY_SESSION_KEY,
        JSON.stringify({
          entities: ["sensor.humidity"],
          start_time: START,
          end_time: END,
        })
      );
      const { hass, sendMessagePromise } = createHassFixture({
        savedPage: { entities: ["sensor.temperature"] },
      });
      const panel = await mountPanel(hass, {});
      expect(sendMessagePromise).toHaveBeenCalledWith({
        type: "hass_datapoints/events_bounds",
      });
      expect(sendMessagePromise).toHaveBeenCalledWith({
        type: "frontend/get_user_data",
        key: PANEL_HISTORY_PREFERENCES_KEY,
      });
      expect(control(panel.shadowRoot!, "panel-shell").hasSavedState).toBe(
        true
      );
      expect(new URLSearchParams(window.location.search).get("entity_id")).toBe(
        "sensor.humidity"
      );
    });
  });
});

describe("GIVEN URL targets and saved row analysis", () => {
  describe("WHEN Home Assistant preferences arrive", () => {
    it("THEN merges saved analysis and color into the selected target", async () => {
      expect.assertions(2);
      window.history.replaceState(
        null,
        "",
        "/datapoints?entity_id=sensor.temperature"
      );
      const { hass } = createHassFixture({
        preferences: {
          page_state: {
            series_rows: [
              {
                entity_id: "sensor.temperature",
                color: "#ff0000",
                visible: true,
                analysis: { sample_interval: "24h", sample_aggregate: "mean" },
              },
            ],
          },
        },
      });
      const panel = await mountPanel(hass);
      const row = control(panel.shadowRoot!, "history-targets").rows[0];
      expect(row.analysis.sample_interval).toBe("24h");
      expect(row.color).toBe("#ff0000");
    });
  });
});

describe("GIVEN a user edit while preferences are still loading", () => {
  describe("WHEN delayed preferences return a visible row", () => {
    it("THEN preserves the user's hidden row", async () => {
      expect.assertions(1);
      const { hass, sendMessagePromise } = createHassFixture();
      let resolvePreferences!: (value: {
        value: RecordWithUnknownValues;
      }) => void;
      const preferences = new Promise<{ value: RecordWithUnknownValues }>(
        (resolve) => {
          resolvePreferences = resolve;
        }
      );
      const respond = sendMessagePromise.getMockImplementation()!;
      sendMessagePromise.mockImplementation((message) => {
        if (
          message.type === "frontend/get_user_data" &&
          message.key === PANEL_HISTORY_PREFERENCES_KEY
        ) {
          return preferences;
        }
        return respond(message);
      });
      const panel = await mountPanel(hass);
      const targets = control(panel.shadowRoot!, "history-targets");
      emitControlEvent(
        control(targets.shadowRoot!, "target-row-list"),
        "dp-row-visibility-change",
        { entityId: "sensor.temperature", visible: false }
      );
      resolvePreferences({
        value: {
          page_state: {
            series_rows: [{ entity_id: "sensor.temperature", visible: true }],
          },
        },
      });
      await settlePanel();
      expect(targets.rows[0].visible).toBe(false);
    });
  });
});

describe("GIVEN a panel subscribed to HA events", () => {
  describe("WHEN it disconnects and reconnects with the same hass object", () => {
    it("THEN unsubscribes and resumes the subscription without replacing its controls", async () => {
      expect.assertions(4);
      const { hass, unsubscribe } = createHassFixture();
      const panel = await mountPanel(hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      panel.remove();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
      document.body.appendChild(panel);
      panel.hass = hass;
      await settlePanel();
      expect(hass.connection!.subscribeEvents).toHaveBeenCalledTimes(2);
      expect(control(panel.shadowRoot!, "range-toolbar")).toBe(toolbar);
      expect(control(panel.shadowRoot!, "panel-shell").hass).toBe(hass);
    });
  });
});
