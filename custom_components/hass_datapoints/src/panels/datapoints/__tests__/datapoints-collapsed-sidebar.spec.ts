import { describe, expect, it, vi } from "vitest";
import {
  PanelCardFixture,
  control,
  createHassFixture,
  mountPanel,
  settlePanel,
  emitControlEvent,
  usePanelFixture,
} from "./panel-fixture";
import type { DateTimeInput } from "@/atoms/form/date-time-input/date-time-input";

usePanelFixture();

function useMobileViewport() {
  const media = window.matchMedia.bind(window);
  vi.spyOn(window, "matchMedia").mockImplementation((query) => {
    const result = media(query);
    Object.defineProperty(result, "matches", { value: true });
    return result;
  });
}

describe("GIVEN a range toolbar in the mobile panel", () => {
  describe("WHEN its date properties change", () => {
    it("THEN renders the formatted local dates without a panel sync call", async () => {
      expect.assertions(2);
      useMobileViewport();
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      toolbar.startTime = new Date(2025, 0, 8, 9, 30);
      toolbar.endTime = new Date(2025, 0, 9, 10, 45);
      await toolbar.updateComplete;
      expect(
        toolbar.shadowRoot!.querySelector<DateTimeInput>(
          "date-time-input#range-mobile-start"
        )?.value
      ).toBe("2025-01-08T09:30");
      expect(
        toolbar.shadowRoot!.querySelector<DateTimeInput>(
          "date-time-input#range-mobile-end"
        )?.value
      ).toBe("2025-01-09T10:45");
    });
  });
});

describe("GIVEN sidebar preferences projected through the panel shell", () => {
  describe("WHEN a display preference changes while the sidebar is expanded", () => {
    it("THEN keeps the collapsed menu ready with the same preference", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      const sidebar = shell.querySelector("sidebar-options");
      expect(sidebar?.slot).toBe("sidebar-options");
      emitControlEvent(sidebar!, "dp-display-change", {
        kind: "tooltips",
        value: false,
      });
      await settlePanel();
      const menu = shell.querySelector("collapsed-options-menu");
      expect(menu?.slot).toBe("collapsed-options");
      expect(menu?.showTooltips).toBe(false);
    });
  });
});

describe("GIVEN the rendered collapsed sidebar", () => {
  describe("WHEN its rail background and add button are clicked", () => {
    it("THEN stays collapsed until its explicit toggle is clicked", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      emitControlEvent(shell, "dp-shell-sidebar-toggle");
      await settlePanel();
      const targets = control(panel.shadowRoot!, "history-targets");
      targets.click();
      await settlePanel();
      expect(shell.sidebarCollapsed).toBe(true);
      targets
        .shadowRoot!.querySelector<HTMLElement>(
          ".history-targets-collapsed-add"
        )!
        .click();
      await settlePanel();
      expect(shell.sidebarCollapsed).toBe(true);
      shell.shadowRoot!.querySelector<HTMLElement>("#sidebar-toggle")!.click();
      await settlePanel();
      expect(shell.sidebarCollapsed).toBe(false);
    });
  });
});

describe("GIVEN mobile date inputs with a valid local range", () => {
  describe("WHEN the user edits a native date input", () => {
    it("THEN commits the range to the toolbar and chart", async () => {
      expect.assertions(3);
      useMobileViewport();
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      const end = toolbar.endTime!;
      const start = new Date(end.getTime() - 86400_000);
      const value = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}T09:30`;
      const dateInput = toolbar.shadowRoot!.querySelector<DateTimeInput>(
        "#range-mobile-start"
      )!;
      const nativeInput = dateInput.shadowRoot!.querySelector("input")!;
      nativeInput.value = value;
      nativeInput.dispatchEvent(new Event("change", { bubbles: true }));
      await settlePanel();
      expect(toolbar.startTime?.getTime()).toBe(new Date(value).getTime());
      expect(dateInput.value).toBe(value);
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.start_time
      ).toBe(new Date(value).toISOString());
    });
  });
});

describe("GIVEN split charts selected in the sidebar", () => {
  describe("WHEN independent Y axes are enabled", () => {
    it("THEN selects independent axes in both preference controls", async () => {
      expect.assertions(2);
      const panel = await mountPanel(createHassFixture().hass);
      const sidebar = control(panel.shadowRoot!, "sidebar-options");
      emitControlEvent(sidebar, "dp-display-change", {
        kind: "split_chart_view",
        value: true,
      });
      await settlePanel();
      emitControlEvent(sidebar, "dp-display-change", {
        kind: "delink_y_axis",
        value: true,
      });
      await settlePanel();
      expect(sidebar.yAxisMode).toBe("unique");
      expect(
        control(panel.shadowRoot!, "collapsed-options-menu").yAxisMode
      ).toBe("unique");
    });
  });
});
