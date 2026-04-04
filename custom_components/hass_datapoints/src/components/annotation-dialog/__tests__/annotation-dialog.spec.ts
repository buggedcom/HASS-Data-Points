import { describe, expect, it } from "vitest";
import { HistoryAnnotationDialogController } from "../annotation-dialog.js";

describe("HistoryAnnotationDialogController", () => {
  describe("GIVEN visible and hidden series rows", () => {
    describe("WHEN deriving the default linked target", () => {
      it("THEN it includes only visible entity ids from target rows", () => {
        expect.assertions(1);
        const host = {
          _config: {
            series_settings: [
              { entity_id: "sensor.visible_one" },
              { entity_id: "sensor.hidden_one" },
              { entity_id: "sensor.visible_two" },
            ],
          },
          _hiddenSeries: new Set(["sensor.hidden_one"]),
          _entityIds: ["sensor.fallback"],
        };
        const controller = new HistoryAnnotationDialogController(host as never);

        expect(controller._getDefaultLinkedTarget()).toEqual({
          entity_id: ["sensor.visible_one", "sensor.visible_two"],
          device_id: [],
          area_id: [],
          label_id: [],
        });
      });
    });
  });

  describe("GIVEN no visible series settings", () => {
    describe("WHEN deriving the default linked target", () => {
      it("THEN it falls back to the host entity ids", () => {
        expect.assertions(1);
        const host = {
          _config: {},
          _hiddenSeries: new Set(),
          _entityIds: ["sensor.fallback_one", "sensor.fallback_two"],
        };
        const controller = new HistoryAnnotationDialogController(host as never);

        expect(controller._getDefaultLinkedTarget()).toEqual({
          entity_id: ["sensor.fallback_one", "sensor.fallback_two"],
          device_id: [],
          area_id: [],
          label_id: [],
        });
      });
    });
  });

  describe("GIVEN a host with visible target rows and a shadow root", () => {
    describe("WHEN opening the annotation dialog", () => {
      it("THEN it mounts annotation-chip-row with visible related entity chips", () => {
        expect.assertions(7);
        const host = document.createElement("div");
        host.attachShadow({ mode: "open" });
        host._config = {
          series_settings: [
            { entity_id: "sensor.visible_one" },
            { entity_id: "sensor.hidden_one" },
          ],
        };
        host._hiddenSeries = new Set(["sensor.hidden_one"]);
        host._entityIds = ["sensor.fallback"];
        host._hass = {
          states: {
            "sensor.visible_one": {
              entity_id: "sensor.visible_one",
              attributes: {
                friendly_name: "Visible One",
                icon: "mdi:thermometer",
              },
            },
          },
        };
        host._creatingContextAnnotation = false;
        const controller = new HistoryAnnotationDialogController(host as never);

        controller.open({ timeMs: Date.now() });

        const chipRow = host.shadowRoot.querySelector(
          "annotation-chip-row"
        ) as HTMLElement & {
          chips?: Array<{
            itemId: string;
            secondaryText?: string;
            stateObj?: Record<string, unknown> | null;
          }>;
          hass?: Record<string, unknown> | null;
        };

        expect(chipRow).not.toBeNull();
        expect(Array.isArray(chipRow.chips)).toBe(true);
        expect(chipRow.chips).toHaveLength(1);
        expect(chipRow.chips?.[0]?.itemId).toBe("sensor.visible_one");
        expect(chipRow.hass).toBe(host._hass);
        expect(chipRow.chips?.[0]?.secondaryText).toBe("sensor.visible_one");
        expect(
          (chipRow.chips?.[0]?.stateObj?.attributes as Record<string, unknown>)
            ?.icon
        ).toBe("mdi:thermometer");
      });
    });
  });
});
