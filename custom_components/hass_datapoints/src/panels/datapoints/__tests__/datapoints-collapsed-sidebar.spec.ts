/**
 * @deprecated migration-debris: rewrite in #32 (#06.4 menus) and #33 (#06.5 targets).
 * Kept running until its control migrates; use datapoints-mounted-* for the behavioural gate (#28).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HassDatapointsHistoryPanel } from "../datapoints";

describe("HassDatapointsHistoryPanel collapsed sidebar interactions", () => {
  let panel: RecordWithUnknownValues;

  beforeEach(() => {
    panel = {};
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GIVEN the sidebar is collapsed", () => {
    beforeEach(() => {
      panel._sidebarCollapsed = true;
      panel._toggleSidebarCollapsed = vi.fn();
    });

    describe("WHEN the collapsed rail background is clicked", () => {
      it("THEN it does not toggle the sidebar", () => {
        expect.assertions(1);
        HassDatapointsHistoryPanel.prototype._handleCollapsedSidebarClick.call(
          panel,
          {
            composedPath: () => [
              {
                classList: {
                  contains: () => false,
                },
              },
            ],
          }
        );

        expect(panel._toggleSidebarCollapsed).not.toHaveBeenCalled();
      });
    });

    describe("WHEN the collapsed add button is clicked", () => {
      it("THEN it does not toggle the sidebar", () => {
        expect.assertions(1);
        HassDatapointsHistoryPanel.prototype._handleCollapsedSidebarClick.call(
          panel,
          {
            composedPath: () => [
              {
                classList: {
                  contains: (className: string) =>
                    className === "history-targets-collapsed-add",
                },
              },
            ],
          }
        );

        expect(panel._toggleSidebarCollapsed).not.toHaveBeenCalled();
      });
    });
  });

  describe("GIVEN a target picker with an inner generic picker", () => {
    describe("WHEN opening the target picker", () => {
      it("THEN it delegates to orchestration with the target control", () => {
        expect.assertions(1);
        const openTargetPicker = vi.fn();
        panel._targetControl = {
          shadowRoot: {
            querySelector: () => null,
          },
        };
        panel._context = {
          orchestration: {
            openTargetPicker,
          },
        };

        HassDatapointsHistoryPanel.prototype._openTargetPicker.call(
          panel,
          null
        );

        expect(openTargetPicker).toHaveBeenCalledWith(
          panel._targetControl,
          null
        );
      });
    });
  });

  describe("GIVEN a target picker without an inner generic picker", () => {
    describe("WHEN opening the target picker", () => {
      it("THEN it still delegates to orchestration", () => {
        expect.assertions(1);
        const openTargetPicker = vi.fn();
        panel._targetControl = {
          shadowRoot: {
            querySelector: () => null,
          },
          focus: vi.fn(),
          click: vi.fn(),
        };
        panel._context = {
          orchestration: {
            openTargetPicker,
          },
        };

        HassDatapointsHistoryPanel.prototype._openTargetPicker.call(
          panel,
          null
        );

        expect(openTargetPicker).toHaveBeenCalledWith(
          panel._targetControl,
          null
        );
      });
    });
  });
});
