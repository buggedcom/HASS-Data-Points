import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { DOMAIN } from "@/constants";
import "../anomaly-monitors-panel";

vi.mock("@/lib/ha/ha-components", () => ({
  confirmDestructiveAction: vi.fn(() => Promise.resolve(true)),
}));

type Panel = HTMLElement & { hass: unknown; updateComplete: Promise<boolean> };

function monitor(id: string, name: string, entityId: string) {
  return {
    id,
    type: "individual",
    name,
    enabled: true,
    look_back_hours: 24,
    scan_interval_minutes: 30,
    created_at: "2026-05-19T10:00:00Z",
    last_scan_at: null,
    last_anomaly_at: null,
    last_cluster_count: 0,
    last_scan_data_points: null,
    scan_history: [],
    device_id: "device-1",
    anomaly_methods: ["trend_residual"],
    anomaly_sensitivity: "medium",
    dismissed_windows: [],
    entity_id: entityId,
  };
}

const MONITORS = [
  monitor("m1", "Kitchen anomaly", "sensor.temp"),
  monitor("m2", "Bathroom anomaly", "sensor.humidity"),
];

async function mount(monitors: unknown[] = MONITORS) {
  const hass = createMockHass({
    connection: {
      subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
      sendMessagePromise: vi.fn((m: { type: string }) =>
        Promise.resolve(
          m.type === `${DOMAIN}/monitors/list` ? { monitors } : {}
        )
      ),
    },
  });
  const el = document.createElement("anomaly-monitors-panel") as Panel;
  el.hass = hass;
  document.body.appendChild(el);
  await vi.waitFor(() => {
    const root = el.shadowRoot!;
    if (
      !root.querySelector(".monitor-card, .monitors-empty") ||
      root.textContent!.includes("Loading…")
    ) {
      throw new Error("panel still loading");
    }
  });
  await el.updateComplete;
  return el;
}

const cards = (el: Panel) => el.shadowRoot!.querySelectorAll(".monitor-card");

async function select(el: Panel, ids: string[]) {
  el.shadowRoot!.querySelector("monitor-entity-filter")!.dispatchEvent(
    new CustomEvent("dp-change", {
      detail: { type: "entity-list", value: ids },
      bubbles: true,
      composed: true,
    })
  );
  await el.updateComplete;
}

describe("anomaly-monitors-panel entity filter", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("GIVEN monitors using different entities", () => {
    describe("WHEN the panel loads", () => {
      it("THEN the filter offers each entity used and all cards show", async () => {
        expect.assertions(2);
        const el = await mount();
        const filter = el.shadowRoot!.querySelector(
          "monitor-entity-filter"
        ) as HTMLElement & { entityIds: string[] };
        expect([...filter.entityIds].sort()).toStrictEqual([
          "sensor.humidity",
          "sensor.temp",
        ]);
        expect(cards(el)).toHaveLength(2);
      });
    });

    describe("WHEN one entity is selected", () => {
      it("THEN only monitors using it remain", async () => {
        expect.assertions(2);
        const el = await mount();
        await select(el, ["sensor.humidity"]);
        expect(cards(el)).toHaveLength(1);
        expect(cards(el)[0].textContent).toContain("Bathroom anomaly");
      });
    });

    describe("WHEN two entities are selected", () => {
      it("THEN monitors using either remain", async () => {
        expect.assertions(1);
        const el = await mount();
        await select(el, ["sensor.humidity", "sensor.temp"]);
        expect(cards(el)).toHaveLength(2);
      });
    });

    describe("WHEN the selection matches no monitor", () => {
      it("THEN a filter-specific empty state shows, not the no-monitors one", async () => {
        expect.assertions(3);
        const el = await mount();
        await select(el, ["sensor.gone"]);
        expect(cards(el)).toHaveLength(0);
        expect(el.shadowRoot!.querySelector(".filter-empty")).not.toBeNull();
        expect(el.shadowRoot!.textContent).not.toContain(
          "No monitors configured"
        );
      });
    });

    describe("WHEN the panel is closed and reopened", () => {
      it("THEN a fresh panel has no filter applied", async () => {
        expect.assertions(1);
        const el = await mount();
        await select(el, ["sensor.humidity"]);
        el.remove();
        const reopened = await mount();
        expect(cards(reopened)).toHaveLength(2);
      });
    });
  });

  describe("GIVEN no monitors at all", () => {
    describe("WHEN the panel loads", () => {
      it("THEN the no-monitors empty state shows and no filter control", async () => {
        expect.assertions(2);
        const el = await mount([]);
        expect(el.shadowRoot!.textContent).toContain("No monitors configured");
        expect(
          el.shadowRoot!.querySelector("monitor-entity-filter")
        ).toBeNull();
      });
    });
  });
});
