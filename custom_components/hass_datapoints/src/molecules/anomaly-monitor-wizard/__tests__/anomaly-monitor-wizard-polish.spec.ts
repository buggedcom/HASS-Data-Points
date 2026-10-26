import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../anomaly-monitor-wizard";
import { defaultEntityConfig } from "../monitor-wizard-logic";
import { createMockHass } from "@/test-support/mock-hass";

type WizardEl = HTMLElement & {
  hass: unknown;
  open: boolean;
  prefillEntityIds: string[];
  editMonitor: unknown;
  updateComplete: Promise<boolean>;
  _step: number;
  _entityIds: string[];
  _activeEntityId: string;
  _monitorType: string;
  _name: string;
  _error: string;
  _entityConfigs: Map<string, ReturnType<typeof defaultEntityConfig>>;
};

function createWizard(props: RecordWithUnknownValues = {}) {
  const el = document.createElement("anomaly-monitor-wizard") as WizardEl;
  Object.assign(el, {
    hass: createMockHass(),
    open: true,
    prefillEntityIds: [],
    editMonitor: null,
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

function configWith(methods: string[]) {
  return { ...defaultEntityConfig(), anomaly_methods: methods };
}

async function goToStep(el: WizardEl, step: number, entityIds: string[]) {
  el._entityIds = entityIds;
  el._activeEntityId = entityIds[0];
  el._step = step;
  await el.updateComplete;
}

const q = (el: WizardEl, sel: string) => el.shadowRoot!.querySelector(sel);
const qa = (el: WizardEl, sel: string) =>
  Array.from(el.shadowRoot!.querySelectorAll(sel));

describe("anomaly-monitor-wizard polish (#106)", () => {
  let el: WizardEl;

  afterEach(() => {
    el?.remove();
    vi.restoreAllMocks();
  });

  describe("GIVEN the create flow on step 2", () => {
    beforeEach(async () => {
      el = createWizard({ prefillEntityIds: ["sensor.a", "sensor.b"] });
      await el.updateComplete;
      await goToStep(el, 2, ["sensor.a", "sensor.b"]);
    });

    it("THEN renders three numbered dots with the first marked done and the second active", () => {
      expect.assertions(5);
      const dots = qa(el, ".step-dot");
      expect(dots).toHaveLength(3);
      expect(dots[0].classList.contains("done")).toBe(true);
      expect(dots[0].querySelector('ha-icon[icon="mdi:check"]')).not.toBeNull();
      expect(dots[1].classList.contains("active")).toBe(true);
      expect(dots[1].textContent).toContain("2");
    });

    describe("WHEN the completed first dot is clicked", () => {
      it("THEN the wizard returns to step 1", async () => {
        expect.assertions(1);
        (qa(el, ".step-dot")[0] as HTMLElement).click();
        await el.updateComplete;
        expect(el._step).toBe(1);
      });
    });

    describe("WHEN the not-yet-visited third dot is clicked", () => {
      it("THEN the wizard stays on step 2", async () => {
        expect.assertions(2);
        const third = qa(el, ".step-dot")[2] as HTMLButtonElement;
        expect(third.disabled).toBe(true);
        third.click();
        await el.updateComplete;
        expect(el._step).toBe(2);
      });
    });

    describe("WHEN the user has visited step 3 and gone back to step 1", () => {
      it("THEN clicking the third dot jumps forward again", async () => {
        expect.assertions(1);
        el._step = 3;
        await el.updateComplete;
        el._step = 1;
        await el.updateComplete;
        (qa(el, ".step-dot")[2] as HTMLElement).click();
        await el.updateComplete;
        expect(el._step).toBe(3);
      });
    });

    it("THEN each entity tab shows a badge with its enabled method count", async () => {
      expect.assertions(2);
      el._entityConfigs = new Map([
        ["sensor.a", configWith(["iqr", "threshold"])],
        ["sensor.b", configWith(["iqr"])],
      ]);
      await el.updateComplete;
      const badges = qa(el, ".entity-tab .tab-badge").map((b) =>
        b.textContent?.trim()
      );
      expect(badges).toEqual(["2", "1"]);
      expect(qa(el, ".entity-tab")).toHaveLength(2);
    });

    describe("WHEN another entity is chosen in the Copy from control", () => {
      it("THEN the active entity receives that entity's detection config", async () => {
        expect.assertions(2);
        const source = {
          ...configWith(["iqr", "threshold"]),
          anomaly_sensitivity: "high",
        };
        el._entityConfigs = new Map([
          ["sensor.a", source],
          ["sensor.b", configWith(["trend_residual"])],
        ]);
        el._activeEntityId = "sensor.b";
        await el.updateComplete;

        const select = q(el, ".copy-from inline-select") as HTMLElement;
        select.dispatchEvent(
          new CustomEvent("dp-change", {
            detail: { type: "select", value: "sensor.a" },
            bubbles: true,
            composed: true,
          })
        );
        await el.updateComplete;

        const copied = el._entityConfigs.get("sensor.b")!;
        expect(copied.anomaly_methods).toEqual(["iqr", "threshold"]);
        expect(copied.anomaly_sensitivity).toBe("high");
      });
    });
  });

  describe("GIVEN a single entity on step 2", () => {
    it("THEN no Copy from control is shown", async () => {
      expect.assertions(1);
      el = createWizard({ prefillEntityIds: ["sensor.a"] });
      await el.updateComplete;
      await goToStep(el, 2, ["sensor.a"]);
      expect(q(el, ".copy-from")).toBeNull();
    });
  });

  describe("GIVEN step 1", () => {
    it("THEN shows the info note about choosing individual or combined later", async () => {
      expect.assertions(1);
      el = createWizard();
      await el.updateComplete;
      expect(q(el, ".step-info-note")?.textContent).toContain(
        "individual or combined"
      );
    });
  });

  describe("GIVEN step 3 with several entities", () => {
    beforeEach(async () => {
      el = createWizard({ prefillEntityIds: ["sensor.a", "sensor.b"] });
      await el.updateComplete;
      el._entityConfigs = new Map([
        ["sensor.a", configWith(["iqr", "threshold"])],
        ["sensor.b", configWith(["iqr"])],
      ]);
      await goToStep(el, 3, ["sensor.a", "sensor.b"]);
    });

    it("THEN sensor type is a radio group of two cards with device-count subtitles", () => {
      expect.assertions(4);
      const cards = qa(el, ".radio-card");
      expect(cards).toHaveLength(2);
      expect(cards[0].getAttribute("aria-checked")).toBe("true");
      expect(cards[0].textContent).toContain("2 devices");
      expect(cards[1].textContent).toContain("1 device");
    });

    it("THEN the name field is labelled Name prefix with the appended-name hint", () => {
      expect.assertions(2);
      expect(q(el, "ha-textfield")?.getAttribute("label")).toBe("Name prefix");
      expect(q(el, ".name-hint")).not.toBeNull();
    });

    it("THEN the summary row counts monitors and rules", () => {
      expect.assertions(1);
      expect(q(el, ".summary-row")?.textContent?.trim()).toBe(
        "Will create 2 monitors · 3 detection rules total"
      );
    });

    describe("WHEN the Combined sensor card is chosen", () => {
      beforeEach(async () => {
        (qa(el, ".radio-card")[1] as HTMLElement).click();
        await el.updateComplete;
      });

      it("THEN the monitor type becomes combined", () => {
        expect.assertions(1);
        expect(el._monitorType).toBe("combined");
      });

      it("THEN the name field is labelled Monitor name without the hint", () => {
        expect.assertions(2);
        expect(q(el, "ha-textfield")?.getAttribute("label")).toBe(
          "Monitor name"
        );
        expect(q(el, ".name-hint")).toBeNull();
      });

      it("THEN overlap mode helper text is shown", () => {
        expect.assertions(1);
        expect(q(el, ".overlap-help")?.textContent?.length).toBeGreaterThan(0);
      });

      it("THEN the summary shows a single monitor", () => {
        expect.assertions(1);
        expect(q(el, ".summary-row")?.textContent?.trim()).toBe(
          "Will create 1 monitor · 2 detection rules total"
        );
      });
    });
  });

  describe("GIVEN a single entity on step 3", () => {
    it("THEN the name field is labelled Monitor name", async () => {
      expect.assertions(1);
      el = createWizard({ prefillEntityIds: ["sensor.a"] });
      await el.updateComplete;
      await goToStep(el, 3, ["sensor.a"]);
      expect(q(el, "ha-textfield")?.getAttribute("label")).toBe("Monitor name");
    });
  });

  describe("GIVEN edit mode", () => {
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
      el = createWizard({ editMonitor });
      await el.updateComplete;
    });

    it("THEN renders two dots", () => {
      expect.assertions(1);
      expect(qa(el, ".step-dot")).toHaveLength(2);
    });

    it("THEN step 3 uses the Updates wording in the summary", async () => {
      expect.assertions(1);
      el._step = 3;
      await el.updateComplete;
      expect(q(el, ".summary-row")?.textContent?.trim()).toBe(
        "Updates 1 monitor · 1 detection rule total"
      );
    });
  });
});
