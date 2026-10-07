import { describe, expect, it } from "vitest";
import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN the mounted history targets", () => {
  describe("WHEN an entity is selected in the HA target picker", () => {
    it("THEN adds a series row and forwards the entities to the chart", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const targets = control(panel.shadowRoot!, "history-targets");
      emitControlEvent(
        targets.querySelector("ha-target-picker")!,
        "value-changed",
        { value: { entity_id: ["sensor.humidity"] } }
      );
      await settlePanel();
      expect(targets.rows.map((row) => row.entity_id)).toEqual([
        "sensor.temperature",
        "sensor.humidity",
      ]);
      expect(
        control(targets.shadowRoot!, "target-row-list").rows.map(
          (row) => row.entity_id
        )
      ).toEqual(["sensor.temperature", "sensor.humidity"]);
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.entities
      ).toEqual(["sensor.temperature", "sensor.humidity"]);
    });
  });
  describe("WHEN a series emits visibility and color changes", () => {
    it("THEN reflects both changes in the rendered rows and chart settings", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const targets = control(panel.shadowRoot!, "history-targets");
      const rowList = control(targets.shadowRoot!, "target-row-list");
      emitControlEvent(rowList, "dp-row-color-change", {
        index: 0,
        color: "#123456",
      });
      emitControlEvent(rowList, "dp-row-visibility-change", {
        entityId: "sensor.temperature",
        visible: false,
      });
      await settlePanel();
      expect(targets.rows[0]).toMatchObject({
        entity_id: "sensor.temperature",
        color: "#123456",
        visible: false,
      });
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.series_settings
      ).toEqual([
        expect.objectContaining({
          entity_id: "sensor.temperature",
          color: "#123456",
          visible: false,
        }),
      ]);
    });
  });
  describe("WHEN the last series is removed", () => {
    it("THEN empties the rows and shows the entity selection prompt", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const targets = control(panel.shadowRoot!, "history-targets");
      emitControlEvent(
        control(targets.shadowRoot!, "target-row-list"),
        "dp-row-remove",
        { index: 0 }
      );
      await settlePanel();
      expect(targets.rows).toHaveLength(0);
      expect(
        panel.shadowRoot!.querySelector("#content")?.textContent
      ).toContain("Select one or more entities");
    });
  });
});
