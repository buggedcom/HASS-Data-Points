import { afterEach, describe, expect, it } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { HassDatapointsHistoryCardEditor } from "../editor";

if (!customElements.get("hass-datapoints-history-card-editor")) {
  customElements.define(
    "hass-datapoints-history-card-editor",
    HassDatapointsHistoryCardEditor
  );
}

function createEditor() {
  const el = document.createElement(
    "hass-datapoints-history-card-editor"
  ) as HassDatapointsHistoryCardEditor;
  document.body.appendChild(el);
  el.hass = createMockHass();
  el.setConfig({
    entity: "sensor.temperature",
    series_settings: [
      {
        entity_id: "sensor.temperature",
        color: "#03a9f4",
        visible: true,
        analysis: {
          sample_interval: "1m",
          sample_aggregate: "mean",
          stepped_series: true,
        },
      },
    ],
  });
  return el;
}

function createEditorWithBinary(binaryDisplay?: string) {
  const el = document.createElement(
    "hass-datapoints-history-card-editor"
  ) as HassDatapointsHistoryCardEditor;
  document.body.appendChild(el);
  el.hass = createMockHass();
  el.setConfig({
    series_settings: [
      {
        entity_id: "sensor.temperature",
        color: "#03a9f4",
        visible: true,
        analysis: {},
      },
      {
        entity_id: "binary_sensor.motion",
        color: "#ff9800",
        visible: true,
        analysis: {},
        ...(binaryDisplay ? { binary_display: binaryDisplay } : {}),
      },
    ],
  });
  return el;
}

function binarySelectFor(
  el: HassDatapointsHistoryCardEditor,
  entityId: string
): (HTMLElement & { value?: string }) | undefined {
  return el.shadowRoot?.querySelector(
    `inline-select[data-binary-entity="${entityId}"]`
  ) as (HTMLElement & { value?: string }) | undefined;
}

describe("history editor", () => {
  let el: Nullable<HassDatapointsHistoryCardEditor> = null;

  afterEach(() => {
    el?.remove();
    el = null;
  });

  it("THEN it renders the stepped series switch from the current analysis config", async () => {
    expect.assertions(2);

    el = createEditor();
    await el.updateComplete;

    const switches = Array.from(
      el.shadowRoot?.querySelectorAll("editor-switch") || []
    ) as Array<HTMLElement & { label?: string; checked?: boolean }>;
    const steppedSwitch = switches.find(
      (entry) => entry.label === "Stepped series"
    );

    expect(steppedSwitch).toBeTruthy();
    expect(steppedSwitch?.checked).toBe(true);
  });

  it("THEN it carries stepped series through config updates", async () => {
    expect.assertions(2);

    el = createEditor();
    await el.updateComplete;

    const switches = Array.from(
      el.shadowRoot?.querySelectorAll("editor-switch") || []
    ) as Array<HTMLElement & { label?: string }>;
    const steppedSwitch = switches.find(
      (entry) => entry.label === "Stepped series"
    );
    let emittedConfig: RecordWithUnknownValues | null = null;
    el.addEventListener("config-changed", (event: Event) => {
      emittedConfig = (
        event as CustomEvent<{ config: RecordWithUnknownValues }>
      ).detail.config;
    });

    steppedSwitch?.dispatchEvent(
      new CustomEvent("dp-change", {
        detail: { checked: false },
        bubbles: true,
        composed: true,
      })
    );

    expect(emittedConfig).toBeTruthy();
    expect(
      (emittedConfig?.series_settings as Array<RecordWithUnknownValues>)?.[0]
        ?.analysis?.stepped_series
    ).toBe(false);
  });

  describe("GIVEN the series include a binary_sensor", () => {
    it("THEN it renders a binary-display control only for the binary_sensor row", async () => {
      expect.assertions(2);

      el = createEditorWithBinary();
      await el.updateComplete;

      expect(binarySelectFor(el, "binary_sensor.motion")).toBeTruthy();
      expect(binarySelectFor(el, "sensor.temperature")).toBeFalsy();
    });

    it("THEN an absent binary_display shows background by default", async () => {
      expect.assertions(1);

      el = createEditorWithBinary();
      await el.updateComplete;

      expect(binarySelectFor(el, "binary_sensor.motion")?.value).toBe(
        "background"
      );
    });

    describe("WHEN row is selected", () => {
      it("THEN it writes binary_display: 'row' into that series' config", async () => {
        expect.assertions(2);

        el = createEditorWithBinary();
        await el.updateComplete;

        let emittedConfig: RecordWithUnknownValues | null = null;
        el.addEventListener("config-changed", (event: Event) => {
          emittedConfig = (
            event as CustomEvent<{ config: RecordWithUnknownValues }>
          ).detail.config;
        });

        binarySelectFor(el, "binary_sensor.motion")?.dispatchEvent(
          new CustomEvent("dp-change", {
            detail: { type: "select", value: "row" },
            bubbles: true,
            composed: true,
          })
        );

        const rows =
          emittedConfig?.series_settings as Array<RecordWithUnknownValues>;
        const binaryRow = rows?.find(
          (row) => row.entity_id === "binary_sensor.motion"
        );
        const numericRow = rows?.find(
          (row) => row.entity_id === "sensor.temperature"
        );
        expect(binaryRow?.binary_display).toBe("row");
        expect(numericRow?.binary_display).toBeUndefined();
      });
    });

    describe("WHEN background is selected on a row-mode sensor", () => {
      it("THEN it clears the key back to the default rather than writing 'background'", async () => {
        expect.assertions(1);

        el = createEditorWithBinary("row");
        await el.updateComplete;

        let emittedConfig: RecordWithUnknownValues | null = null;
        el.addEventListener("config-changed", (event: Event) => {
          emittedConfig = (
            event as CustomEvent<{ config: RecordWithUnknownValues }>
          ).detail.config;
        });

        binarySelectFor(el, "binary_sensor.motion")?.dispatchEvent(
          new CustomEvent("dp-change", {
            detail: { type: "select", value: "background" },
            bubbles: true,
            composed: true,
          })
        );

        const rows =
          emittedConfig?.series_settings as Array<RecordWithUnknownValues>;
        const binaryRow = rows?.find(
          (row) => row.entity_id === "binary_sensor.motion"
        );
        expect(binaryRow?.binary_display).toBeUndefined();
      });
    });
  });
});
