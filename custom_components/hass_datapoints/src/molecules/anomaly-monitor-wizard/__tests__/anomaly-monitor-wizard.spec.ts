import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../anomaly-monitor-wizard";
import * as monitorsApi from "@/lib/data/monitors-api";

function createHass() {
  return {
    connection: {
      sendMessagePromise: vi
        .fn()
        .mockResolvedValue({ monitor: { id: "new-id" } }),
    },
    states: {},
  };
}

function createElement(props: RecordWithUnknownValues = {}) {
  const el = document.createElement("anomaly-monitor-wizard") as HTMLElement & {
    hass: unknown;
    open: boolean;
    prefillEntityIds: string[];
    prefillAnalysis: unknown;
    editMonitor: unknown;
    updateComplete: Promise<boolean>;
    _step: number;
    _entityIds: string[];
    _name: string;
    _entityConfigs: Map<string, { anomaly_methods: string[] }>;
    _saving: boolean;
  };
  Object.assign(el, {
    hass: createHass(),
    open: true,
    prefillEntityIds: [],
    prefillAnalysis: null,
    editMonitor: null,
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

describe("anomaly-monitor-wizard", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => {
    el?.remove();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  describe("GIVEN open=true", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    it("THEN starts on step 1", () => {
      expect.assertions(1);
      expect(el._step).toBe(1);
    });

    it("THEN renders ha-dialog", () => {
      expect.assertions(1);
      expect(el.shadowRoot!.querySelector("ha-dialog")).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Prefill
  // ---------------------------------------------------------------------------

  describe("GIVEN prefillEntityIds", () => {
    beforeEach(async () => {
      el = createElement({ prefillEntityIds: ["sensor.temp", "sensor.hum"] });
      await el.updateComplete;
    });

    it("THEN populates _entityIds from prefill", () => {
      expect.assertions(2);
      expect(el._entityIds).toContain("sensor.temp");
      expect(el._entityIds).toContain("sensor.hum");
    });
  });

  describe("GIVEN prefillAnalysis", () => {
    beforeEach(async () => {
      el = createElement({
        prefillEntityIds: ["sensor.temp"],
        prefillAnalysis: { anomaly_methods: ["iqr", "persistence"] },
      });
      await el.updateComplete;
    });

    it("THEN applies prefilled anomaly_methods to entity config", () => {
      expect.assertions(1);
      expect(el._entityConfigs.get("sensor.temp")?.anomaly_methods).toEqual([
        "iqr",
        "persistence",
      ]);
    });
  });

  // ---------------------------------------------------------------------------
  // Edit mode
  // ---------------------------------------------------------------------------

  describe("GIVEN editMonitor", () => {
    const editMonitor = {
      id: "mon-1",
      type: "individual",
      name: "Edit Me",
      entity_id: "sensor.edit",
      enabled: true,
      look_back_hours: 48,
      scan_interval_minutes: 60,
      anomaly_methods: ["iqr"],
      anomaly_sensitivity: "high",
      anomaly_overlap_mode: "all",
      anomaly_rate_window: "1h",
      anomaly_zscore_window: "24h",
      anomaly_persistence_window: "1h",
      anomaly_trend_method: "rolling_average",
      anomaly_trend_window: "24h",
      scan_history: [],
      last_cluster_count: 0,
      last_scan_at: null,
      created_at: "2024-01-01T00:00:00",
      sample_interval: null,
      sample_aggregate: "mean",
      anomaly_use_sampled_data: false,
    };

    beforeEach(async () => {
      el = createElement({ editMonitor });
      await el.updateComplete;
    });

    it("THEN starts on step 2", () => {
      expect.assertions(1);
      expect(el._step).toBe(2);
    });

    it("THEN populates name from editMonitor", () => {
      expect.assertions(1);
      expect(el._name).toBe("Edit Me");
    });
  });

  // ---------------------------------------------------------------------------
  // Step navigation
  // ---------------------------------------------------------------------------

  describe("GIVEN step 1 with no entities", () => {
    beforeEach(async () => {
      el = createElement({ prefillEntityIds: [] });
      await el.updateComplete;
    });

    it("WHEN Next is clicked THEN shows error", async () => {
      expect.assertions(1);
      const nextBtn = el.shadowRoot!.querySelector(
        "ha-button[raised]"
      ) as HTMLElement;
      nextBtn?.click();
      await el.updateComplete;
      expect(el.shadowRoot!.textContent).toContain(
        "Select at least one entity"
      );
    });
  });

  describe("GIVEN step 1 with entities", () => {
    beforeEach(async () => {
      el = createElement({ prefillEntityIds: ["sensor.a"] });
      await el.updateComplete;
    });

    it("WHEN Next is clicked THEN advances to step 2", async () => {
      expect.assertions(1);
      const nextBtn = el.shadowRoot!.querySelector(
        "ha-button[raised]"
      ) as HTMLElement;
      nextBtn?.click();
      await el.updateComplete;
      expect(el._step).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // Submit — create
  // ---------------------------------------------------------------------------

  describe("GIVEN valid state on step 3", () => {
    let createMonitorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      createMonitorSpy = vi
        .spyOn(monitorsApi, "createMonitor")
        .mockResolvedValue({
          id: "created",
          type: "individual",
          name: "New Monitor",
          entity_id: "sensor.a",
          enabled: true,
          look_back_hours: 24,
          scan_interval_minutes: 30,
          created_at: "2024-01-01",
          last_scan_at: null,
          last_cluster_count: 0,
          scan_history: [],
          anomaly_methods: ["iqr"],
          anomaly_sensitivity: "medium",
          anomaly_overlap_mode: "all",
          anomaly_rate_window: "1h",
          anomaly_zscore_window: "24h",
          anomaly_persistence_window: "1h",
          anomaly_trend_method: "rolling_average",
          anomaly_trend_window: "24h",
          sample_interval: null,
          sample_aggregate: "mean",
          anomaly_use_sampled_data: false,
        });

      el = createElement({ prefillEntityIds: ["sensor.a"] });
      await el.updateComplete;
      // Advance to step 3
      el._step = 3 as 1 | 2 | 3;
      el._name = "New Monitor";
      await el.updateComplete;
    });

    afterEach(() => createMonitorSpy.mockRestore());

    it("WHEN Save is clicked THEN calls createMonitor", async () => {
      expect.assertions(1);
      const saveBtn = el.shadowRoot!.querySelector(
        "ha-button[raised]"
      ) as HTMLElement;
      saveBtn?.click();
      await el.updateComplete;
      // Allow async submit
      await new Promise<void>((r) => {
        setTimeout(r, 0);
      });
      expect(createMonitorSpy).toHaveBeenCalledOnce();
    });

    it("WHEN Save is clicked THEN emits dp-monitor-wizard-saved", async () => {
      expect.assertions(1);
      const saved: CustomEvent[] = [];
      el.addEventListener("dp-monitor-wizard-saved", (e) =>
        saved.push(e as CustomEvent)
      );
      const saveBtn = el.shadowRoot!.querySelector(
        "ha-button[raised]"
      ) as HTMLElement;
      saveBtn?.click();
      await new Promise<void>((r) => {
        setTimeout(r, 10);
      });
      expect(saved).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Submit — edit
  // ---------------------------------------------------------------------------

  describe("GIVEN edit mode on step 3", () => {
    let updateMonitorSpy: ReturnType<typeof vi.spyOn>;
    const editMonitor = {
      id: "mon-1",
      type: "individual" as const,
      name: "Old Name",
      entity_id: "sensor.a",
      enabled: true,
      look_back_hours: 24,
      scan_interval_minutes: 30,
      created_at: "2024-01-01",
      last_scan_at: null,
      last_cluster_count: 0,
      scan_history: [],
      anomaly_methods: ["iqr"],
      anomaly_sensitivity: "medium",
      anomaly_overlap_mode: "all",
      anomaly_rate_window: "1h",
      anomaly_zscore_window: "24h",
      anomaly_persistence_window: "1h",
      anomaly_trend_method: "rolling_average",
      anomaly_trend_window: "24h",
      sample_interval: null as string | null,
      sample_aggregate: "mean",
      anomaly_use_sampled_data: false,
    };

    beforeEach(async () => {
      updateMonitorSpy = vi
        .spyOn(monitorsApi, "updateMonitor")
        .mockResolvedValue({ ...editMonitor, name: "New Name" });

      el = createElement({ editMonitor });
      await el.updateComplete;
      el._step = 3 as 1 | 2 | 3;
      el._name = "New Name";
      await el.updateComplete;
    });

    afterEach(() => updateMonitorSpy.mockRestore());

    it("WHEN Save is clicked THEN calls updateMonitor not createMonitor", async () => {
      expect.assertions(1);
      const createMonitorSpy = vi.spyOn(monitorsApi, "createMonitor");
      const saveBtn = el.shadowRoot!.querySelector(
        "ha-button[raised]"
      ) as HTMLElement;
      saveBtn?.click();
      await new Promise<void>((r) => {
        setTimeout(r, 10);
      });
      expect(createMonitorSpy).not.toHaveBeenCalled();
      createMonitorSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Close event
  // ---------------------------------------------------------------------------

  describe("GIVEN open wizard", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    it("WHEN Cancel is clicked THEN emits dp-monitor-wizard-close", async () => {
      expect.assertions(1);
      const closed: Event[] = [];
      el.addEventListener("dp-monitor-wizard-close", (e) => closed.push(e));
      const cancelBtn = Array.from(
        el.shadowRoot!.querySelectorAll("ha-button")
      ).find((b) => b.textContent?.includes("Cancel")) as HTMLElement;
      cancelBtn?.click();
      await el.updateComplete;
      expect(closed).toHaveLength(1);
    });
  });
});
