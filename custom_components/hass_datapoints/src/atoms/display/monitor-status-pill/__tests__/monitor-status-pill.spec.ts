import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { MonitorStatus } from "@/lib/data/monitor-status";
import "../monitor-status-pill";

function createElement(status: MonitorStatus = "healthy", label = "") {
  const el = document.createElement("monitor-status-pill") as HTMLElement & {
    status: MonitorStatus;
    label: string;
  };
  el.status = status;
  el.label = label;
  document.body.appendChild(el);
  return el;
}

describe("monitor-status-pill", () => {
  let el: HTMLElement & { status: MonitorStatus; label: string };

  afterEach(() => {
    if (el) el.remove();
  });

  describe("GIVEN a pill with an explicit label", () => {
    beforeEach(async () => {
      el = createElement("triggered", "Triggered");
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it shows the label text", () => {
        const label = el.shadowRoot!.querySelector(".label");
        expect(label?.textContent?.trim()).toBe("Triggered");
      });

      it("THEN it renders a status dot", () => {
        expect(el.shadowRoot!.querySelector(".dot")).toBeTruthy();
      });

      it("THEN the pill carries the status modifier class", () => {
        const pill = el.shadowRoot!.querySelector(".pill");
        expect(pill?.classList.contains("status-triggered")).toBe(true);
      });
    });
  });

  describe("GIVEN a pill with no explicit label", () => {
    beforeEach(async () => {
      el = createElement("warning");
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it falls back to the capitalised status name", () => {
        const label = el.shadowRoot!.querySelector(".label");
        expect(label?.textContent?.trim()).toBe("Warning");
      });
    });
  });

  describe("GIVEN a pill whose status changes", () => {
    beforeEach(async () => {
      el = createElement("healthy");
      await el.updateComplete;
    });

    describe("WHEN the status property is updated", () => {
      it("THEN the modifier class and fallback label update", async () => {
        el.status = "paused";
        await el.updateComplete;
        const pill = el.shadowRoot!.querySelector(".pill");
        expect(pill?.classList.contains("status-paused")).toBe(true);
        expect(pill?.classList.contains("status-healthy")).toBe(false);
        expect(
          el.shadowRoot!.querySelector(".label")?.textContent?.trim()
        ).toBe("Paused");
      });
    });
  });

  describe("GIVEN each possible status", () => {
    const cases: Array<[MonitorStatus, string]> = [
      ["paused", "Paused"],
      ["healthy", "Healthy"],
      ["warning", "Warning"],
      ["triggered", "Triggered"],
    ];

    describe.each(cases)('WHEN status is "%s"', (status, expectedLabel) => {
      it(`THEN the fallback label is "${expectedLabel}"`, async () => {
        el = createElement(status);
        await el.updateComplete;
        expect(
          el.shadowRoot!.querySelector(".label")?.textContent?.trim()
        ).toBe(expectedLabel);
      });
    });
  });
});
