import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../dp-annotation-chip-row";
import type { ChipItem } from "../dp-annotation-chip-row";

const SAMPLE_CHIPS: ChipItem[] = [
  { type: "entity_id", itemId: "sensor.living_room_temp", icon: "mdi:thermometer", name: "Living room temp" },
  { type: "device_id", itemId: "device-abc", icon: "mdi:devices", name: "My device" },
];

function createElement(props: Record<string, unknown> = {}) {
  const el = document.createElement("dp-annotation-chip-row") as HTMLElement & {
    chips: ChipItem[];
    label: string;
    helpText: string;
    emptyText: string;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, {
    chips: SAMPLE_CHIPS,
    label: "Linked targets",
    helpText: "These targets will be associated with the new data point by default.",
    emptyText: "No linked targets will be associated with this data point.",
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

describe("dp-annotation-chip-row", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  // ---------------------------------------------------------------------------
  // Structure — with chips
  // ---------------------------------------------------------------------------

  describe("GIVEN two chips", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the label", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-form-label")?.textContent?.trim()).toBe("Linked targets");
      });

      it("THEN renders the help text", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-form-help")?.textContent?.trim()).toBe(
          "These targets will be associated with the new data point by default.",
        );
      });

      it("THEN renders the chip row", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-chip-row")).not.toBeNull();
      });

      it("THEN renders a dp-annotation-chip for each chip", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelectorAll("dp-annotation-chip").length).toBe(2);
      });

      it("THEN passes the correct type to each chip", () => {
        expect.assertions(2);
        const chips = Array.from(
          el.shadowRoot!.querySelectorAll("dp-annotation-chip"),
        ) as (HTMLElement & { type: string })[];
        expect(chips[0].type).toBe("entity_id");
        expect(chips[1].type).toBe("device_id");
      });

      it("THEN passes the correct itemId to each chip", () => {
        expect.assertions(2);
        const chips = Array.from(
          el.shadowRoot!.querySelectorAll("dp-annotation-chip"),
        ) as (HTMLElement & { itemId: string })[];
        expect(chips[0].itemId).toBe("sensor.living_room_temp");
        expect(chips[1].itemId).toBe("device-abc");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Structure — empty
  // ---------------------------------------------------------------------------

  describe("GIVEN chips is empty", () => {
    beforeEach(async () => {
      el = createElement({ chips: [] });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the empty text instead of help text", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-form-help")?.textContent?.trim()).toBe(
          "No linked targets will be associated with this data point.",
        );
      });

      it("THEN does not render the chip row", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-chip-row")).toBeNull();
      });

      it("THEN renders no dp-annotation-chip elements", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelectorAll("dp-annotation-chip").length).toBe(0);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  describe("GIVEN two chips and rendered", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN dp-chip-remove fires from a child chip", () => {
      it("THEN re-emits dp-target-remove with type and id", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-target-remove", handler);
        const chipRow = el.shadowRoot!.querySelector(".context-chip-row")!;
        chipRow.dispatchEvent(
          new CustomEvent("dp-chip-remove", {
            detail: { type: "entity_id", itemId: "sensor.living_room_temp" },
            bubbles: true,
            composed: true,
          }),
        );
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.type).toBe("entity_id");
        expect(handler.mock.calls[0][0].detail.id).toBe("sensor.living_room_temp");
      });

      it("THEN does not let the raw dp-chip-remove event propagate to the host", () => {
        expect.assertions(1);
        const rawHandler = vi.fn();
        el.addEventListener("dp-chip-remove", rawHandler);
        const chipRow = el.shadowRoot!.querySelector(".context-chip-row")!;
        chipRow.dispatchEvent(
          new CustomEvent("dp-chip-remove", {
            detail: { type: "entity_id", itemId: "sensor.living_room_temp" },
            bubbles: true,
            composed: true,
          }),
        );
        expect(rawHandler).not.toHaveBeenCalled();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Custom label / text
  // ---------------------------------------------------------------------------

  describe("GIVEN a custom label", () => {
    beforeEach(async () => {
      el = createElement({ label: "Related items" });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN shows the custom label", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector(".context-form-label")?.textContent?.trim()).toBe("Related items");
      });
    });
  });
});
