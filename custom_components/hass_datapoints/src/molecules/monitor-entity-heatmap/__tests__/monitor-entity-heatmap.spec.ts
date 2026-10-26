import { afterEach, describe, expect, it } from "vitest";
import "../monitor-entity-heatmap";
import type { EntityAnomalyActivity } from "@/lib/data/monitors-api";

const START = Date.UTC(2026, 0, 1);
const HOUR = 3_600_000;

function buckets(counts: number[]) {
  return counts.map((count, i) => ({
    start_ms: START + i * HOUR,
    end_ms: START + (i + 1) * HOUR,
    anomaly_count: count,
    incident_count: count > 0 ? 1 : 0,
  }));
}

function entity(id: string, counts: number[]): EntityAnomalyActivity {
  return {
    entity_id: id,
    total: counts.reduce((a, b) => a + b, 0),
    incident_count: counts.filter((c) => c > 0).length,
    buckets: buckets(counts),
  };
}

type Heatmap = HTMLElement & {
  hass: unknown;
  entityIds: string[];
  activity: EntityAnomalyActivity[] | null;
  startMs: number;
  endMs: number;
  updateComplete: Promise<boolean>;
};

async function mount(props: Partial<Heatmap>) {
  const el = document.createElement("monitor-entity-heatmap") as Heatmap;
  Object.assign(el, {
    hass: {
      states: {
        "sensor.temp": {
          entity_id: "sensor.temp",
          state: "1",
          attributes: { friendly_name: "Temperature" },
        },
      },
    },
    startMs: START,
    endMs: START + 4 * HOUR,
    ...props,
  });
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe("monitor-entity-heatmap", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("GIVEN activity for two entities", () => {
    describe("WHEN it renders", () => {
      it("THEN each entity gets a row with name, id, count and one block per bucket", async () => {
        expect.assertions(5);
        const el = await mount({
          entityIds: ["sensor.temp", "sensor.hum"],
          activity: [
            entity("sensor.temp", [0, 2, 0, 1]),
            entity("sensor.hum", [0, 0, 0, 0]),
          ],
        });
        const rows = el.shadowRoot!.querySelectorAll(".heatmap-row");
        expect(rows).toHaveLength(2);
        expect(rows[0].querySelector(".heatmap-name")!.textContent).toContain(
          "Temperature"
        );
        expect(rows[0].querySelector(".heatmap-id")!.textContent).toContain(
          "sensor.temp"
        );
        expect(
          rows[0].querySelector(".heatmap-count")!.textContent!.trim()
        ).toBe("3");
        expect(rows[0].querySelectorAll(".heatmap-block")).toHaveLength(4);
      });

      it("THEN shared x-axis date ticks are rendered", async () => {
        expect.assertions(1);
        const el = await mount({
          entityIds: ["sensor.temp"],
          activity: [entity("sensor.temp", [0, 0, 0, 0])],
        });
        expect(
          el.shadowRoot!.querySelectorAll(".heatmap-axis .heatmap-tick").length
        ).toBeGreaterThan(1);
      });
    });

    describe("WHEN a block is hovered", () => {
      it("THEN a tooltip shows the bucket range with anomaly and incident counts", async () => {
        expect.assertions(2);
        const el = await mount({
          entityIds: ["sensor.temp"],
          activity: [entity("sensor.temp", [0, 2, 0, 1])],
        });
        const block = el.shadowRoot!.querySelectorAll(".heatmap-block")[1];
        block.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
        await el.updateComplete;
        const tip = el.shadowRoot!.querySelector(".heatmap-tooltip");
        expect(tip).not.toBeNull();
        expect(tip!.textContent).toMatch(
          /2 anomalous readings[\s\S]*1 incident/
        );
      });
    });

    describe("WHEN a block is clicked", () => {
      it("THEN it fires dp-heatmap-block-click with the entity and bucket window", async () => {
        expect.assertions(1);
        const el = await mount({
          entityIds: ["sensor.temp"],
          activity: [entity("sensor.temp", [0, 2, 0, 1])],
        });
        let detail: unknown = null;
        el.addEventListener("dp-heatmap-block-click", (e) => {
          detail = (e as CustomEvent).detail;
        });
        (
          el.shadowRoot!.querySelectorAll(".heatmap-block")[1] as HTMLElement
        ).click();
        expect(detail).toStrictEqual({
          entityId: "sensor.temp",
          startMs: START + HOUR,
          endMs: START + 2 * HOUR,
        });
      });
    });
  });

  describe("GIVEN an entity row", () => {
    describe("WHEN the label is clicked", () => {
      it("THEN it fires dp-heatmap-entity-click with the entity id", async () => {
        expect.assertions(1);
        const el = await mount({ entityIds: ["sensor.temp"], activity: null });
        let detail: unknown = null;
        el.addEventListener("dp-heatmap-entity-click", (e) => {
          detail = (e as CustomEvent).detail;
        });
        (el.shadowRoot!.querySelector(".heatmap-label") as HTMLElement).click();
        expect(detail).toStrictEqual({ entityId: "sensor.temp" });
      });
    });
  });

  describe("GIVEN no activity (empty, paused or failed fetch)", () => {
    describe("WHEN it renders", () => {
      it("THEN each entity shows a flat zero row with no blocks", async () => {
        expect.assertions(3);
        const el = await mount({ entityIds: ["sensor.temp"], activity: null });
        const row = el.shadowRoot!.querySelector(".heatmap-row")!;
        expect(row.querySelector(".heatmap-count")!.textContent!.trim()).toBe(
          "0"
        );
        expect(row.querySelector(".heatmap-flat")).not.toBeNull();
        expect(row.querySelectorAll(".heatmap-block")).toHaveLength(0);
      });
    });
  });
});
