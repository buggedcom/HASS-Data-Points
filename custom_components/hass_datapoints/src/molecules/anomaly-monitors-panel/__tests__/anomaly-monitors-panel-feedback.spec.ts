import { afterEach, describe, expect, it, vi } from "vitest";
import { createMockHass } from "@/test-support/mock-hass";
import { DOMAIN } from "@/constants";
import "../anomaly-monitors-panel";

vi.mock("@/lib/ha/ha-components", () => ({
  confirmDestructiveAction: vi.fn(() => Promise.resolve(true)),
}));

type Panel = HTMLElement & {
  hass: unknown;
  updateComplete: Promise<boolean>;
  _editMonitor: unknown;
};

function monitor(id: string, name: string, entityId = "sensor.temp") {
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
  monitor("m1", "Kitchen"),
  monitor("m2", "Bathroom", "sensor.humidity"),
];

async function mount() {
  const hass = createMockHass({
    connection: {
      subscribeEvents: vi.fn(() => Promise.resolve(vi.fn())),
      sendMessagePromise: vi.fn((m: { type: string }) =>
        Promise.resolve(
          m.type === `${DOMAIN}/monitors/list` ? { monitors: MONITORS } : {}
        )
      ),
    },
  });
  const el = document.createElement("anomaly-monitors-panel") as Panel;
  el.hass = hass;
  document.body.appendChild(el);
  await vi.waitFor(() => {
    if (!el.shadowRoot!.querySelector(".monitor-card")) {
      throw new Error("loading");
    }
  });
  await el.updateComplete;
  return el;
}

function save(el: Panel, monitors: unknown[]) {
  el.shadowRoot!.querySelector("anomaly-monitor-wizard")!.dispatchEvent(
    new CustomEvent("dp-monitor-wizard-saved", {
      detail: { monitors },
      bubbles: true,
      composed: true,
    })
  );
}

function toasts(el: Panel) {
  const messages: string[] = [];
  el.addEventListener("hass-notification", (e) =>
    messages.push((e as CustomEvent).detail.message)
  );
  return messages;
}

const flashing = (el: Panel) =>
  [...el.shadowRoot!.querySelectorAll(".monitor-card[data-flash]")].map((c) =>
    c.querySelector(".monitor-name")!.textContent!.trim()
  );

describe("anomaly-monitors-panel create/edit feedback", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("GIVEN a single monitor was created", () => {
    describe("WHEN the wizard reports it saved", () => {
      it("THEN toasts Created with its name and flashes its row", async () => {
        const el = await mount();
        const messages = toasts(el);
        save(el, [MONITORS[0]]);
        await vi.waitFor(() => expect(flashing(el)).toEqual(["Kitchen"]));
        expect(messages).toEqual(['Created "Kitchen"']);
      });
    });
  });

  describe("GIVEN several monitors were created at once", () => {
    describe("WHEN the wizard reports them saved", () => {
      it("THEN toasts a count and flashes every new row", async () => {
        const el = await mount();
        const messages = toasts(el);
        save(el, MONITORS);
        await vi.waitFor(() => expect(flashing(el)).toHaveLength(2));
        expect(messages).toEqual(["Created 2 anomaly monitors"]);
      });
    });
  });

  describe("GIVEN an existing monitor was edited", () => {
    describe("WHEN the wizard reports it saved", () => {
      it("THEN toasts Saved with its name and flashes its row", async () => {
        const el = await mount();
        const messages = toasts(el);
        el._editMonitor = MONITORS[1];
        save(el, [MONITORS[1]]);
        await vi.waitFor(() => expect(flashing(el)).toEqual(["Bathroom"]));
        expect(messages).toEqual(['Saved "Bathroom"']);
      });
    });
  });

  describe("GIVEN the flash duration has elapsed", () => {
    describe("WHEN the row is checked again", () => {
      it("THEN the highlight is removed", async () => {
        const el = await mount();
        save(el, [MONITORS[0]]);
        await vi.waitFor(() => expect(flashing(el)).toHaveLength(1));
        await vi.waitFor(() => expect(flashing(el)).toHaveLength(0), {
          timeout: 4000,
        });
      });
    });
  });

  describe("GIVEN an entity filter hides the saved monitor", () => {
    describe("WHEN the wizard reports it saved", () => {
      it("THEN the filter is cleared so the row is visible and flashes", async () => {
        const el = await mount();
        el.shadowRoot!.querySelector("monitor-entity-filter")!.dispatchEvent(
          new CustomEvent("dp-change", {
            detail: { type: "entity-list", value: ["sensor.humidity"] },
            bubbles: true,
            composed: true,
          })
        );
        await el.updateComplete;
        expect(el.shadowRoot!.querySelectorAll(".monitor-card")).toHaveLength(
          1
        );
        save(el, [MONITORS[0]]);
        await vi.waitFor(() => expect(flashing(el)).toEqual(["Kitchen"]));
      });
    });
  });
});
