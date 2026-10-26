import { afterEach, describe, expect, it } from "vitest";
import "../monitor-entity-filter";

type Filter = HTMLElement & {
  hass: unknown;
  entityIds: string[];
  selected: string[];
  updateComplete: Promise<boolean>;
};

const HASS = {
  states: {
    "sensor.temp": { attributes: { friendly_name: "Kitchen temperature" } },
    "sensor.humidity": { attributes: { friendly_name: "Bathroom humidity" } },
    "sensor.power": { attributes: { friendly_name: "Boiler power" } },
  },
};

async function mount(selected: string[] = []) {
  const el = document.createElement("monitor-entity-filter") as Filter;
  el.hass = HASS;
  el.entityIds = ["sensor.temp", "sensor.humidity", "sensor.power"];
  el.selected = selected;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const q = <T extends Element>(el: Filter, sel: string) =>
  el.shadowRoot!.querySelector<T>(sel);
const qa = <T extends Element>(el: Filter, sel: string) =>
  Array.from(el.shadowRoot!.querySelectorAll<T>(sel));

async function openPicker(el: Filter) {
  q<HTMLButtonElement>(el, ".filter-trigger")!.click();
  await el.updateComplete;
}

function listen(el: Filter) {
  const details: Array<{ type: string; value: string[] }> = [];
  el.addEventListener("dp-change", (e) => {
    details.push((e as CustomEvent).detail);
  });
  return details;
}

describe("monitor-entity-filter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("GIVEN no active filter", () => {
    describe("WHEN the picker is opened", () => {
      it("THEN every entity is listed and no badge or chips show", async () => {
        expect.assertions(3);
        const el = await mount();
        await openPicker(el);
        expect(qa(el, ".option")).toHaveLength(3);
        expect(q(el, ".filter-badge")).toBeNull();
        expect(qa(el, "entity-chip")).toHaveLength(0);
      });
    });

    describe("WHEN the user types a search term", () => {
      it("THEN only matching entities (by name or id) are listed", async () => {
        expect.assertions(2);
        const el = await mount();
        await openPicker(el);
        const input = q<HTMLInputElement>(el, ".search")!;
        input.value = "humid";
        input.dispatchEvent(new Event("input"));
        await el.updateComplete;
        const options = qa(el, ".option");
        expect(options).toHaveLength(1);
        expect(options[0].textContent).toContain("Bathroom humidity");
      });
    });

    describe("WHEN the user searches with no match", () => {
      it("THEN a no-results message is shown", async () => {
        expect.assertions(2);
        const el = await mount();
        await openPicker(el);
        const input = q<HTMLInputElement>(el, ".search")!;
        input.value = "zzz";
        input.dispatchEvent(new Event("input"));
        await el.updateComplete;
        expect(qa(el, ".option")).toHaveLength(0);
        expect(q(el, ".no-results")).not.toBeNull();
      });
    });

    describe("WHEN the user ticks an entity", () => {
      it("THEN dp-change fires an entity-list with that entity", async () => {
        expect.assertions(1);
        const el = await mount();
        const details = listen(el);
        await openPicker(el);
        qa<HTMLInputElement>(el, ".option input")[0].click();
        expect(details).toStrictEqual([
          { type: "entity-list", value: ["sensor.humidity"] },
        ]);
      });
    });
  });

  describe("GIVEN two entities are selected", () => {
    describe("WHEN rendered", () => {
      it("THEN the badge shows the count and a chip per entity", async () => {
        expect.assertions(3);
        const el = await mount(["sensor.temp", "sensor.power"]);
        expect(q(el, ".filter-badge")!.textContent).toContain("2");
        expect(qa(el, "entity-chip")).toHaveLength(2);
        expect(q(el, ".clear-filter")).not.toBeNull();
      });
    });

    describe("WHEN a chip is removed", () => {
      it("THEN that entity is dropped from the selection", async () => {
        expect.assertions(1);
        const el = await mount(["sensor.temp", "sensor.power"]);
        const details = listen(el);
        qa(el, "entity-chip")[0].dispatchEvent(
          new CustomEvent("dp-chip-remove", {
            detail: { type: "entity", itemId: "sensor.temp" },
            bubbles: true,
            composed: true,
          })
        );
        expect(details.map((d) => d.value)).toStrictEqual([["sensor.power"]]);
      });
    });

    describe("WHEN Clear is clicked", () => {
      it("THEN the selection is emptied", async () => {
        expect.assertions(1);
        const el = await mount(["sensor.temp", "sensor.power"]);
        const details = listen(el);
        q<HTMLButtonElement>(el, ".clear-filter")!.click();
        expect(details.map((d) => d.value)).toStrictEqual([[]]);
      });
    });
  });
});
