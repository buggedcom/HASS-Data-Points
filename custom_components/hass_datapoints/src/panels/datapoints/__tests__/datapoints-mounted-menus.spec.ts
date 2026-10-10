import { describe, expect, it, vi } from "vitest";
import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  PanelCardFixture,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("GIVEN the panel's mounted sidebar options", () => {
  describe("WHEN datapoints are hidden", () => {
    it("THEN hides records and forwards the scope to the chart", async () => {
      expect.assertions(3);
      const panel = await mountPanel(createHassFixture().hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      emitControlEvent(
        control(shell.shadowRoot!, "sidebar-options"),
        "dp-scope-change",
        { value: "hidden" }
      );
      await settlePanel();
      expect(
        panel.shadowRoot!.querySelector("hass-datapoints-list-card")
      ).toBeNull();
      expect(
        (
          control(
            panel.shadowRoot!,
            "hass-datapoints-history-card"
          ) as PanelCardFixture
        ).config.datapoint_scope
      ).toBe("hidden");
      expect(control(shell.shadowRoot!, "sidebar-options").datapointScope).toBe(
        "hidden"
      );
    });
  });
});

describe("GIVEN the panel's collapsed sidebar", () => {
  describe("WHEN chart preferences are opened and dismissed with Escape", () => {
    it("THEN shows the options popup and restores its hidden state", async () => {
      expect.assertions(4);
      const panel = await mountPanel(createHassFixture().hass);
      const shell = control(panel.shadowRoot!, "panel-shell");
      emitControlEvent(shell, "dp-shell-sidebar-toggle");
      await settlePanel();
      const targets = control(panel.shadowRoot!, "history-targets");
      expect(targets.sidebarCollapsed).toBe(true);
      targets
        .shadowRoot!.querySelector<HTMLButtonElement>(
          ".history-targets-collapsed-preferences"
        )!
        .click();
      await settlePanel();
      const popup = shell.shadowRoot!.querySelector<HTMLElement>(
        "#collapsed-options-popup"
      )!;
      expect(popup.hidden).toBe(false);
      expect(control(popup, "collapsed-options-menu").datapointScope).toBe(
        "linked"
      );
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true })
      );
      await settlePanel();
      expect(popup.hidden).toBe(true);
    });
  });
});

describe("GIVEN the panel at mobile viewport width", () => {
  describe("WHEN the toolbar sidebar toggle is clicked", () => {
    it("THEN updates the shell and target sidebar together", async () => {
      expect.assertions(3);
      const matchMedia = window.matchMedia.bind(window);
      vi.spyOn(window, "matchMedia").mockImplementation((query) => {
        const media = matchMedia(query);
        Object.defineProperty(media, "matches", { value: true });
        return media;
      });
      const panel = await mountPanel(createHassFixture().hass);
      const toolbar = control(panel.shadowRoot!, "range-toolbar");
      toolbar
        .shadowRoot!.querySelector<HTMLElement>("#range-sidebar-toggle")!
        .click();
      await settlePanel();
      const shell = control(panel.shadowRoot!, "panel-shell");
      expect(shell.layoutMode).toBe("mobile");
      expect(shell.sidebarCollapsed).toBe(true);
      expect(
        control(panel.shadowRoot!, "history-targets").sidebarCollapsed
      ).toBe(true);
    });
  });
});
